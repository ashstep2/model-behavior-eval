import OpenAI from 'openai';
import { ModelResponse } from '@/types';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

export async function queryOpenAI(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): Promise<ModelResponse> {
  const openai = getClient();
  const startTime = Date.now();

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const completion = await openai.chat.completions.create({
      model: modelId,
      messages,
      max_completion_tokens: 2048,
    });

    const latencyMs = Date.now() - startTime;
    const response = completion.choices[0]?.message?.content || '';

    return {
      modelId,
      response,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      modelId,
      response: '',
      latencyMs,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function* streamOpenAI(
  modelId: string,
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<{ text: string; done: boolean }> {
  const openai = getClient();

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const stream = await openai.chat.completions.create({
      model: modelId,
      messages,
      max_completion_tokens: 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        yield { text, done: false };
      }
    }

    yield { text: '', done: true };
  } catch (error) {
    throw error;
  }
}
