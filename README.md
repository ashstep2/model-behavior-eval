# Model Behavior Eval

A production-grade evaluation platform for comparing LLM behavior across models. Built with Next.js 14, TypeScript, and real-time streaming.

**[View the Full PRD →](./Product-Strategy.md)**

---

## The Problem

Generic benchmarks don't predict how models behave in production. A model scoring 90% on reasoning might still:

- Fail to follow explicit formatting instructions
- Produce unparseable JSON 15% of the time
- Behave inconsistently across similar prompts
- Over-refuse legitimate requests

**This tool lets you evaluate models against your specific use case before committing to production.**

---

## Features

- **Pre-built use cases** — Customer Support, Code Assistant, Data Extraction
- **Multi-model comparison** — Claude (Opus, Sonnet, Haiku) + GPT-5 (5.2, 5.2 Mini, Nano)
- **Real-time streaming** — Live progress with Server-Sent Events
- **LLM-as-Judge scoring** — Multi-dimensional evaluation with reasoning
- **Export to Markdown** — Shareable reports for team decision-making

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API keys

Create `.env.local` in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                   Next.js 14 + React 18                      │
│                                                              │
│   /              /evaluate           /results/[id]           │
│   Dashboard      Multi-step Wizard   Results + Export        │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ SSE Streaming
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│                    Next.js API Routes                        │
│                                                              │
│   POST /api/evaluate          Start evaluation               │
│   GET  /api/evaluate/[id]/stream   Real-time progress        │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│   │   Runner    │──│  Evaluator  │──│  Aggregator │         │
│   │ (Orchestr.) │  │ (LLM Judge) │  │  (Results)  │         │
│   └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│   ┌──────────────────┐  ┌──────────────────┐                │
│   │ Anthropic Adapter│  │  OpenAI Adapter  │                │
│   └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Why |
|----------|-----|
| **LLM-as-Judge** | Scalable, consistent, explainable scoring |
| **Async Generators** | Clean streaming orchestration |
| **Adapter Pattern** | Easy to add new model providers |

---

## Evaluation Dimensions

Models are scored 1-5 across six production-critical dimensions:

| Dimension | What It Measures |
|-----------|------------------|
| **Instruction Following** | Does it do exactly what was asked? |
| **Output Structure** | Is JSON valid? Schemas respected? |
| **Reasoning Quality** | Is the logic sound and complete? |
| **Safety Alignment** | Does it refuse harmful requests appropriately? |
| **Consistency** | Same input → same output class? |
| **Developer Experience** | Easy to work with programmatically? |

---

## Project Structure

```
model-behavior-eval/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── evaluate/page.tsx           # Evaluation wizard
│   ├── results/[id]/page.tsx       # Results view
│   └── api/
│       └── evaluate/
│           ├── route.ts            # POST - start eval
│           └── [id]/stream/route.ts # GET - SSE stream
├── components/
│   ├── ui/                         # Design system
│   ├── dashboard/                  # Dashboard components
│   ├── evaluate/                   # Wizard components
│   └── results/                    # Results components
├── lib/
│   ├── models/
│   │   ├── client.ts               # Unified model client
│   │   ├── anthropic.ts            # Claude adapter
│   │   └── openai.ts               # GPT adapter
│   ├── evaluation/
│   │   ├── runner.ts               # Orchestration (async gen)
│   │   └── evaluator.ts            # LLM judge scoring
│   └── data/
│       ├── use-cases.ts            # Pre-built test suites
│       ├── dimensions.ts           # Scoring rubrics
│       └── models.ts               # Model configs
├── store/
│   └── evaluation-store.ts         # Zustand state
└── types/
    └── index.ts                    # TypeScript types
```

---

## API Reference

### Start Evaluation

```bash
POST /api/evaluate
Content-Type: application/json

{
  "useCaseId": "customer-support",
  "models": ["claude-sonnet-4-20250514", "gpt-5.2"]
}

# Response
{ "id": "550e8400-e29b-41d4-a716-446655440000" }
```

### Stream Progress

```bash
GET /api/evaluate/{id}/stream
Accept: text/event-stream

# Events
data: {"type":"progress","data":{"currentTest":1,"totalTests":3,"currentModel":"Claude Sonnet 4"}}
data: {"type":"response","data":{"testId":"cs-001","modelId":"claude-sonnet-4","response":{...}}}
data: {"type":"scores","data":{"testId":"cs-001","scores":[...]}}
data: {"type":"complete","data":{...fullResults...}}
```

---

## Supported Models

### Anthropic
- Claude Opus 4.5 (`claude-opus-4-5-20251101`)
- Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- Claude Haiku 3.5 (`claude-3-5-haiku-20241022`)

### OpenAI
- GPT-5.2 (`gpt-5.2`)
- GPT-5.2 Mini (`gpt-5.2-mini`)
- GPT-5 Nano (`gpt-5-nano`)

---

## Pre-Built Use Cases

### Customer Support Bot
- Intent extraction with JSON output
- Legal threat handling
- Policy adherence

### Code Assistant
- TypeScript function generation
- Security vulnerability detection
- Code explanation

### Data Extraction
- JSON schema compliance
- Entity recognition
- Malformed input handling

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Streaming:** Server-Sent Events
- **LLM SDKs:** @anthropic-ai/sdk, openai

---

## Development

```bash
# Install
npm install

# Dev server
npm run dev

# Type check
npm run type-check

# Build
npm run build

# Lint
npm run lint
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude models |
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT models |

---

This project demonstrates production-grade AI engineering: streaming architecture, LLM-as-Judge evaluation, multi-provider abstraction, and enterprise-ready design.

[View the Full PRD →](./Product-Strategy.md)
