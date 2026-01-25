# Product Requirements Document: Model Behavior Evaluation Framework

## Executive Summary

### Problem Statement

API developers building with LLMs face a critical gap: **generic benchmarks don't predict how models behave in production.** A model that scores 90% on reasoning benchmarks might still:
- Fail to follow explicit formatting instructions
- Produce unparseable JSON 15% of the time
- Behave inconsistently across similar prompts
- Over-refuse legitimate requests due to safety miscalibration

Developers need a way to evaluate models against **their specific use case** before committing to production.

### Solution

A web-based evaluation platform that lets developers:
1. Select a use case (or define custom test cases)
2. Run structured evaluations across multiple models
3. Get scored results across dimensions that matter for production

### Metrics - How to measure success?

| Metric | Target | Rationale |
|--------|--------|-----------|
| Time to first evaluation | < 2 minutes | Fast time-to-value |
| Evaluation completion rate | > 85% | Users finish what they start |
| Report export rate | > 40% | Signal of genuine utility |
| Return usage (7-day) | > 30% | Sticky product |

---

## Technical Architecture Deep Dive

### Why This Architecture Is Production-Grade

#### 1. Server-Sent Events (SSE) Streaming Pipeline

```
Client                    Server                     LLM APIs
  │                         │                           │
  │──── GET /stream ───────>│                           │
  │                         │                           │
  │<── SSE: progress ──────-│                           │
  │                         │──── Query Claude ────────>│
  │<── SSE: response ──────-│<──── Response ───────────-│
  │                         │                           │
  │<── SSE: scoring ───────-│──── Score w/ Judge ─────->│
  │                         │<──── Scores ─────────────-│
  │                         │                           │
  │<── SSE: complete ──────-│                           │
  │                         │                           │
```

**Why this matters:**
- Real-time progress without WebSocket overhead or connection complexity
- Automatic reconnection built into browser EventSource API
- Unidirectional flow matches evaluation semantics perfectly
- HTTP/2 multiplexing support out of the box

#### 2. LLM-as-Judge Evaluation Pattern

This implements the **industry-standard evaluation methodology**, using a strong model (Claude Sonnet) as an impartial judge provides:

- **Consistency**: Same scoring rubric applied uniformly
- **Explainability**: Reasoning provided for each score
- **Scalability**: No human labeling bottleneck
- **Dimension Coverage**: Multi-aspect evaluation in single pass

```typescript
// The judge evaluates against a structured rubric
const scoringPrompt = `
Evaluate this response against the criteria:

DIMENSION: ${dimension.name}
RUBRIC:
- 5: ${dimension.rubric[5]}
- 4: ${dimension.rubric[4]}
- 3: ${dimension.rubric[3]}
- 2: ${dimension.rubric[2]}
- 1: ${dimension.rubric[1]}

Provide score (1-5) and reasoning.
`;
```

#### 3. Async Generator Orchestration

The evaluation runner uses **async generators**—the most elegant pattern for streaming multi-step workflows:

```typescript
async function* runEvaluation(
  testCases: TestCase[],
  models: ModelConfig[]
): AsyncGenerator<StreamEvent> {
  for (const test of testCases) {
    for (const model of models) {
      yield { type: 'progress', model, test };

      const response = await queryModel(model, test.prompt);
      yield { type: 'response', response };

      const scores = await scoreWithJudge(response, test);
      yield { type: 'scores', scores };
    }
  }
  yield { type: 'complete', results: aggregate() };
}
```

**Why async generators:**
- Natural backpressure handling
- Clean separation between orchestration and transport
- Easy to test each step in isolation
- Composable with other async iterables

#### 4. Multi-Provider Adapter Pattern

Clean abstraction over heterogeneous LLM APIs:

```typescript
interface ModelAdapter {
  query(prompt: string, systemPrompt?: string): Promise<ModelResponse>;
}

class AnthropicAdapter implements ModelAdapter { /* ... */ }
class OpenAIAdapter implements ModelAdapter { /* ... */ }

// Unified interface - provider differences abstracted away
const response = await getAdapter(modelId).query(prompt);
```

**Extensibility:** Adding Google Gemini, Mistral, or local models requires only a new adapter—zero changes to evaluation logic.

#### 5. Type-Safe End-to-End

Full TypeScript coverage from API contracts to UI components:

```typescript
// Shared types ensure API/client contract
interface StreamEvent {
  type: 'progress' | 'response' | 'scores' | 'complete' | 'error';
  data: ProgressData | ResponseData | ScoreData | ResultsData | ErrorData;
}

// Discriminated unions for exhaustive handling
function handleEvent(event: StreamEvent) {
  switch (event.type) {
    case 'progress': return updateProgress(event.data);
    case 'response': return addResponse(event.data);
    // TypeScript ensures all cases handled
  }
}
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                       Next.js 14 + React 18 + Tailwind                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         App Router Pages                            │ │
│  │                                                                      │ │
│  │   /                    /evaluate              /results/[id]          │ │
│  │   Dashboard            Multi-step Wizard      Results View           │ │
│  │   - Use case cards     - Model selection      - Summary comparison   │ │
│  │   - Recent evals       - Test preview         - Dimension breakdown  │ │
│  │                        - Live progress        - Response viewer      │ │
│  │                        - SSE consumer         - Export to Markdown   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      State Management                               │ │
│  │                                                                      │ │
│  │   • Evaluation config (use case, models, test cases)                │ │
│  │   • Progress state (current test, current model)                    │ │
│  │   • Recent evaluations history                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTP + Server-Sent Events
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│                        Next.js API Routes                                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                          API Layer                                 │  │
│  │                                                                    │  │
│  │   POST /api/evaluate           Start evaluation, return ID         │  │
│  │   GET  /api/evaluate/[id]/stream   SSE endpoint for progress       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                       Evaluation Engine                            │ │
│  │                                                                    │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │ │
│  │   │   Runner        │  │   Evaluator     │  │   Aggregator    │    │ │
│  │   │                 │  │   (LLM Judge)   │  │                 │    │ │
│  │   │ • Orchestrates  │  │                 │  │ • Computes      │    │ │
│  │   │   test flow     │──│ • Scores each   │──│   averages      │    │ │
│  │   │ • Yields SSE    │  │   response      │  │ • Determines    │    │ │
│  │   │   events        │  │ • Multi-dim     │  │   winner        │    │ │
│  │   │ • Error         │  │   rubric        │  │ • Generates     │    │ │
│  │   │   recovery      │  │ • Reasoning     │  │   recommendation│    │ │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      Model Client Layer                            │ │
│  │                                                                    │ │
│  │   ┌─────────────────────────┐    ┌─────────────────────────┐       │ │
│  │   │   Anthropic Adapter     │    │    OpenAI Adapter       │       │ │
│  │   │                         │    │                         │       │ │
│  │   │ • Claude Opus 4.5       │    │ • GPT-5.2               │       │ │
│  │   │ • Claude Sonnet 4       │    │ • GPT-5.2 Mini          │       │ │
│  │   │ • Claude Haiku 3.5      │    │ • GPT-5 Nano            │       │ │
│  │   └─────────────────────────┘    └─────────────────────────┘       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                               │
│                                                                          │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│   │   Anthropic API   │  │    OpenAI API     │  │   localStorage    │  │
│   │                   │  │                   │  │                   │  │
│   │ • Model queries   │  │ • Model queries   │  │ • Results cache   │  │
│   │ • Judge scoring   │  │                   │  │ • Recent history  │  │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Evaluation Dimensions & Rubrics

The system evaluates models across 6 production-critical dimensions:

| Dimension | What It Measures | Why It Matters |
|-----------|------------------|----------------|
| **Instruction Following** | Does the model do exactly what was asked? | Unreliable instruction following breaks automation |
| **Output Structure** | Is JSON valid? Are schemas respected? | Parsing failures cause production incidents |
| **Reasoning Quality** | Is the logic sound and complete? | Garbage reasoning = garbage outputs |
| **Safety Alignment** | Does it refuse harmful requests appropriately? | Safety miscalibration is a liability |
| **Consistency** | Same input → same output class? | Inconsistency destroys user trust |
| **Developer Experience** | Is it easy to work with programmatically? | DX affects velocity and maintenance |

Each dimension has a 5-point rubric with specific, measurable criteria.

---

## User Personas

### Primary: API Developer
- **Role:** Senior software engineer at a Series B startup
- **Goal:** Choose the right model for their customer support chatbot
- **Pain:** Spent 2 weeks A/B testing models in production; got burned by inconsistent JSON output
- **Needs:** Quick, structured comparison before committing

### Secondary: AI Product Manager 
- **Role:** PM at enterprise company evaluating AI vendors
- **Goal:** Create defensible recommendation for leadership
- **Pain:** Can't justify model choice with "it felt better"
- **Needs:** Exportable reports with quantitative scores

### Tertiary: ML Engineer
- **Role:** Building internal model evaluation pipeline
- **Goal:** Establish repeatable evaluation methodology
- **Pain:** Every team evaluates differently; no consistency
- **Needs:** Extensible framework, API access, custom dimensions

---

## User Stories

### MVP (Phase 1) - IMPLEMENTED

| ID | Story | Status |
|----|-------|--------|
| US-1 | As a developer, I can select a pre-built use case so I can start evaluating immediately | Yes |
| US-2 | As a developer, I can choose which models to compare so I can evaluate my options | Yes |
| US-3 | As a developer, I can run an evaluation and see real-time progress so I know it's working | Yes |
| US-4 | As a developer, I can see scored results across dimensions so I can make an informed decision | Yes |
| US-5 | As a developer, I can view the actual model responses so I can verify the scores | Yes |

### Phase 2

| ID | Story | Priority |
|----|-------|----------|
| US-6 | As a developer, I can create custom test cases so I can evaluate my specific prompts | P1 |
| US-7 | As a developer, I can save and re-run evaluations so I can track changes over time | P1 |
| US-8 | As a developer, I can adjust dimension weights so I can prioritize what matters to me | P2 |
| US-9 | As an ML engineer, I can access results via API so I can integrate with my pipeline | P2 |

---

## Design System

### Visual Principles

The UI follows a **minimal, white-first aesthetic** inspired by Linear, Vercel, and Stripe:

---

## Data Models

```typescript
// Core evaluation types
interface EvaluationResults {
  id: string;
  useCaseId: string;
  useCaseName: string;
  models: string[];
  completedAt: string;
  summary: {
    winner: string;
    winnerScore: number;
    scores: Record<string, number>;
  };
  byModel: Record<string, ModelResults>;
  byTest: TestResult[];
  recommendation: string;
}

interface TestResult {
  testCase: TestCase;
  responses: ModelResponse[];
  scores: TestScore[];
  comparison: string;
}

interface TestScore {
  modelId: string;
  overallScore: number;
  dimensionScores: DimensionScore[];
}

interface DimensionScore {
  dimension: DimensionName;
  score: number;      // 1-5
  reasoning: string;  // Judge's explanation
}

type DimensionName =
  | 'instruction_following'
  | 'output_structure'
  | 'reasoning_quality'
  | 'safety_alignment'
  | 'consistency'
  | 'developer_experience';
```

---

## API Specification

### Start Evaluation
```
POST /api/evaluate
Content-Type: application/json

{
  "useCaseId": "customer-support",
  "models": ["claude-sonnet-4-20250514", "gpt-5.2"]
}

Response: { "id": "uuid-v4" }
```

### Stream Progress (SSE)
```
GET /api/evaluate/{id}/stream
Accept: text/event-stream

Events:
  data: {"type":"progress","data":{"currentTest":1,"totalTests":3,"currentModel":"Claude Sonnet 4","status":"querying"}}
  data: {"type":"response","data":{"testId":"cs-001","modelId":"claude-sonnet-4","response":{...}}}
  data: {"type":"scores","data":{"testId":"cs-001","scores":[...]}}
  data: {"type":"complete","data":{...fullResults...}}
```

---

## Examples - Pre-Built Use Cases

### 1. Customer Support Bot
Tests intent extraction, policy adherence, and handling of edge cases like legal threats.

### 2. Code Assistant
Tests code generation accuracy, security vulnerability detection, and explanation quality.

### 3. Data Extraction
Tests JSON schema compliance, entity recognition, and handling of malformed inputs.

---

## End-to-End, High Level: What makes this interesting today

### 1. Full-Stack Technical Depth
- Production-grade streaming architecture
- Multi-provider LLM integration from scratch
- Industry-standard LLM-as-Judge

### 2. Product Thinking (User focused)
- Personas grounded in real developer pain points
- User stories with measurable acceptance criteria
- Progressive disclosure: simple default, powerful when needed

### 3. Systems Architecture
- Adapter pattern for extensibility
- Error handling and recovery

### 4. Designed with UI/DX in mind
- Minimal aesthetic
- Responsive, accessible components
- Real-time feedback throughout the experience

### 5. AI/ML 
- Multi-dimensional scoring rubrics
- Familiar with research methodologies

### 6. Execution Speed
- MVP implemented and functional
- Clean, maintainable codebase
- Deployable to production immediatley

---

🚀 **Ready for Production:**
- Add API keys to `.env.local`
- Deploy to Vercel with `vercel deploy`
