import { LLMRequestError, LLMResponseParseError } from '@/shared/errors'
import type { LLMAdapter, LLMOptions } from '../adapter'

interface OllamaResponse {
  response: string
  done: boolean
}

function isOllamaResponse(value: unknown): value is OllamaResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'response' in value &&
    typeof (value as OllamaResponse).response === 'string' &&
    'done' in value &&
    typeof (value as OllamaResponse).done === 'boolean'
  )
}

export class OllamaAdapter implements LLMAdapter {
  private readonly baseUrl: string
  private readonly defaultModel: string

  constructor(baseUrl = 'http://localhost:11434', defaultModel = 'llama3') {
    this.baseUrl = baseUrl
    this.defaultModel = defaultModel
  }

  async complete(prompt: string, options?: LLMOptions): Promise<string> {
    let response: Response

    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options?.model ?? this.defaultModel,
          prompt,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.2,
            num_predict: options?.maxTokens ?? 2048,
          },
        }),
      })
    } catch (err) {
      throw new LLMRequestError(0, 'Network error or Ollama unreachable', err)
    }

    if (!response.ok) {
      throw new LLMRequestError(response.status, response.statusText)
    }

    let data: unknown

    try {
      data = await response.json()
    } catch (err) {
      throw new LLMResponseParseError(err)
    }

    if (!isOllamaResponse(data)) {
      throw new LLMResponseParseError('Unexpected response shape from Ollama')
    }

    return data.response
  }
}