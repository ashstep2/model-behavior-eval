# Product Document: Model Behavior Evaluation Framework

![Dashboard](images/dashboard.png)
## Executive Summary

### Problem Statement

API developers building with LLMs face a gap: **generic benchmarks don't predict how models will behave in production.** A model that scores highly on reasoning benchmarks may still:
- Fail to follow instructions
- Behave inconsistently across similar prompts
- Over-refuse legitimate requests

Developers need a way to evaluate models against **their specific use case** before committing to production. This is bridging the gap between technical innovation (model capabilities) and developer usage in real-world scenarios. This gap is important to address because this lights up key usage paths/patterns that will be important in general-audience business use cases.

### What I Built

A web-based evaluation platform that lets developers:
1. Select a use case from pre-built evaluation templates
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

## Architecture Deep Dive

### Key Components 

#### 1. Server-Sent Events (SSE) Streaming Pipeline
**Why this matters:**
- Real-time progress (without WebSocket overhead)
- Automatic reconnection 
- DX - makes the UI feel smooth, fast, and responsive

#### 2. LLM-as-Judge Evaluation Pattern

This uses a balanced model (Claude Sonnet) as an impartial judge (intentionally did not select an OAI model) that provides:

- **Consistency**: Same scoring rubric applied
- **Explainability**: Reasoning provided
- **Scalability**: No human labeling bottleneck (though we would want this in PROD environments)

#### 3. Multi-Provider Adapter Pattern

This uses an abstraction over different LLM APIs so that it is easily extensible to other models without changes to evaluation logic.

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
| **Output Structure** | Is JSON valid? | Parsing failures cause production incidents |
| **Reasoning Quality** | Is the logic sound? | Garbage reasoning = garbage outputs |
| **Consistency** | Same input → same output? | Inconsistency destroys user trust |
| **Developer Experience** | Is it easy to work with programmatically? | DX affects velocity and maintenance |
| **Refusal Calibration** | Does it refuse harmful requests without over-refusing legitimate ones? | Over-refusal frustrates developers; under-refusal creates liability |

Each dimension has a 5-point rubric.

---

## Model Behavior Analysis Methodology

### Observable Behavioral Differences

By running this, I've noticed patterns that differ between the OAI and Anthropic model families. These inform both eval design and customer/dev recommendations.

| Behavioral Pattern | Typical OpenAI Behavior | Typical Anthropic Behavior |
|--------------------|------------------------|---------------------------|
| **Instruction compliance** | More likely to "improve" on instructions | Stricter adherence to explicit instructions |
| **Output verbosity** | Tends toward explanation + code | More concise |
| **Refusal surface** | Broader; reasoning models may silently refuse (exhaust tokens without output) | Narrower, explicit refusals with caveats |
| **JSON reliability** | Excellent with `response_format`, variable without | Reliable raw JSON, no native structured mode |
| **Scope creep** | Often adds error handling, comments, improvements | Sticks closer to requested scope |

> **Detailed analysis:** See `docs/model-behavior-insights.md` for  breakdown.

### My Methodology: Customer Pain → Eval Design → Model Improvement Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CUSTOMER → EVAL → IMPROVEMENT LOOP                       │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │   CUSTOMER   │      │    EVAL      │      │    MODEL     │
   │    PAIN      │ ───► │   DESIGN     │ ───► │ IMPROVEMENT  │
   └──────────────┘      └──────────────┘      └──────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
   "Model refuses        Refusal calibration    Adjust safety
    legitimate           tests with security    thresholds for
    security code"       context provided       professional contexts
         │                      │                      │
         ▼                      ▼                      ▼
   "Model adds code      Scope control tests    Tune instruction
    I didn't ask for"    with explicit "ONLY"   following
                         constraints
```

### How This Maps to Post-Training Collab

| Framework Component | Post-Training Use |
|--------------------|-------------------|
| **Customer context** | Helps prioritize which behaviors to optimize |
| **Test cases** | Coud become training data selection criteria |
| **Failure patterns** | Inform targeted improvements |

---

## User Personas

### Primary: API Developer
- **Role:** Senior software engineer
- **Goal:** Choose the right model for their customer support chatbot
- **Pain:** Have to create their own evaluations custom to business use cases
- **Needs:** Quick, structured comparison before committing

### Secondary: AI Product Manager 
- **Role:** PM at enterprise company evaluating AI vendors
- **Goal:** Create defensible recommendation for leadership (a tool they can point to)
- **Pain:** Unable to justify a model recommendation clearly
- **Needs:** Exportable reports with quantitative scores

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
| US-6 | As a developer, I can view detailed reasoning for each score so I understand the evaluation | P1 |
| US-7 | As a developer, I can save and re-run evaluations so I can track changes over time | P1 |
| US-8 | As a developer, I can adjust dimension weights so I can prioritize what matters to me | P2 |

---

## Design System

### Visual Principles

The UI follows a minimal aesthetic.

---

## Examples - Pre-Built Use Cases

### 1. Customer Support Bot
Tests intent extraction, policy adherence, and handling of edge cases like legal threats.

### 2. Code Assistant
Tests code generation accuracy, security vulnerability detection, and explanation quality.

### 3. Coding Behavior Analysis (NEW - takes longer to run)
Tests designed specifically to reveal behavioral differences between model families:

| Test | What It Reveals |
|------|-----------------|
| **Strict Output Format** | Which model can adhere to the specification? |
| **Security Tool Request** | Refusal calibration: Which model over-refuses legitimate security tasks + do they provide a reason? |
| **Minimal Change Request** | Which model adds unrequested improvements? |
| **Ambiguous Requirements** | How do models handle underspecified jobs? |
| **Complex Nested JSON** | Which model complies with schema specifications? |
| **Dual-Use Code Request** | Which model has better refusal calibration for legitimate but sensitive use cases |
| **Stack Trace Debugging** | Which model has precision in code changes |
| **Multi-File Code Navigation** | Which model is accurate in long-context understanding |

**Key Learning:** Silent Refusals in Reasoning Models when max_tokens is set to 2048 (my workaround: increasing the threshold to 16K).

During testing, I  identified a distinct refusal pattern in GPT-5 class reasoning models:

```
Security Tool Request → GPT-5-mini
API Response: { finish_reason: 'length', content: '' }
```

The model exhausted its reasoning token budget (2048 tokens) deliberating on whether to help, without ever producing output. This seems to be an **implicit/silent refusal** with no output, which was very different from Claude's explicit "I can't help with that because..." response. We may need to consider surfacing earlier responses to show that the model is reasoning or immediately responding "I'm unable to answer at this moment because...".

NOTE: There may be a difference in behavior if we call a model from the playground or from the API directly. I've attached screenshots of the behavior difference I noticed.

**Refusal Calibration in my Demo:**

![refusal-calibration](images/refusal-calibration.png)

**Refusal Calibration in the OAI Playground:**
![playground-image](images/playground-image.png)


**Production implications:**
- Silent refusals require different error handling than explicit refusals
- Higher `max_completion_tokens` (16K+) needed for reasoning models
- Empty response + `finish_reason: 'length'` = likely silent refusal
- User experience differs: Claude explains; GPT may return nothing


---

🚀 **Ready for Production:**
- Add API keys
- Deploy to Vercel
