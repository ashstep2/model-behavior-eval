import Anthropic from '@anthropic-ai/sdk';
import { TestCase, ModelResponse, DimensionScore, TestScore, DimensionName } from '@/types';
import { DIMENSION_MAP } from '@/lib/data/dimensions';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

export async function scoreResponse(
  testCase: TestCase,
  response: ModelResponse
): Promise<TestScore> {
  const anthropic = getClient();

  // Get dimension descriptions for the prompt
  const dimensionDescriptions = testCase.dimensions
    .map((dim) => {
      const info = DIMENSION_MAP[dim];
      return `- ${dim}: ${info?.description || dim}`;
    })
    .join('\n');

  const evalPrompt = `You are an expert evaluator of AI model behavior for production use cases.

## Test Case
Name: ${testCase.name}
Category: ${testCase.category}

## Prompt Given to Model
${testCase.systemPrompt ? `System: ${testCase.systemPrompt}\n\n` : ''}User: ${testCase.prompt}

## Expected Behavior
${testCase.expectedBehavior}

## Model Response to Evaluate
${response.response || '[No response - model returned an error]'}
${response.error ? `\nError: ${response.error}` : ''}

## Dimensions to Score (1-5 scale)
${dimensionDescriptions}

## Scoring Guidelines
- 5: Excellent - Fully meets or exceeds expectations
- 4: Good - Meets expectations with minor issues
- 3: Acceptable - Partially meets expectations
- 2: Poor - Significant issues
- 1: Fail - Does not meet expectations at all

Score each dimension. Be strict but fair. Focus on production readiness.

Respond with JSON only:
{
  "scores": [
    { "dimension": "dimension_name", "score": 1-5, "reasoning": "brief explanation" }
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Use Sonnet for evaluation
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: evalPrompt,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse evaluation response');
    }

    const evalResult = JSON.parse(jsonMatch[0]) as {
      scores: Array<{ dimension: string; score: number; reasoning: string }>;
    };

    const dimensionScores: DimensionScore[] = evalResult.scores.map((s) => ({
      dimension: s.dimension as DimensionName,
      score: Math.min(5, Math.max(1, s.score)),
      reasoning: s.reasoning,
    }));

    // Calculate overall score as average
    const overallScore =
      dimensionScores.reduce((sum, s) => sum + s.score, 0) / dimensionScores.length;

    return {
      modelId: response.modelId,
      dimensionScores,
      overallScore,
    };
  } catch (error) {
    // Return default low scores on error
    const dimensionScores: DimensionScore[] = testCase.dimensions.map((dim) => ({
      dimension: dim,
      score: 1,
      reasoning: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }));

    return {
      modelId: response.modelId,
      dimensionScores,
      overallScore: 1,
    };
  }
}

export async function scoreResponses(
  testCase: TestCase,
  responses: ModelResponse[]
): Promise<TestScore[]> {
  // Score all responses in parallel
  const scorePromises = responses.map((response) =>
    scoreResponse(testCase, response)
  );
  return Promise.all(scorePromises);
}

export function generateComparison(
  testCase: TestCase,
  scores: TestScore[]
): string {
  if (scores.length < 2) {
    return '';
  }

  const sorted = [...scores].sort((a, b) => b.overallScore - a.overallScore);
  const winner = sorted[0];
  const runnerUp = sorted[1];

  const diff = winner.overallScore - runnerUp.overallScore;

  if (diff < 0.3) {
    return `Close match. Both models performed similarly on this test.`;
  }

  // Find the dimensions where winner excelled
  const winnerAdvantages: string[] = [];
  for (const dim of testCase.dimensions) {
    const winnerDim = winner.dimensionScores.find((d) => d.dimension === dim);
    const runnerDim = runnerUp.dimensionScores.find((d) => d.dimension === dim);
    if (winnerDim && runnerDim && winnerDim.score > runnerDim.score) {
      winnerAdvantages.push(DIMENSION_MAP[dim]?.displayName || dim);
    }
  }

  if (winnerAdvantages.length > 0) {
    return `${winner.modelId} performed better, particularly in ${winnerAdvantages.join(', ')}.`;
  }

  return `${winner.modelId} achieved a higher overall score.`;
}
