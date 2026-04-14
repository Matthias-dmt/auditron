import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OllamaAdapter } from './index'
import { LLMRequestError, LLMResponseParseError } from '@/shared/errors'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.resetAllMocks()
})

function makeResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad Request',
    json: async () => body,
  } as Response
}

describe('OllamaAdapter', () => {
  describe('complete', () => {
    it('returns response text on success', async () => {
      mockFetch.mockResolvedValue(
        makeResponse({ response: 'hello world', done: true })
      )

      const adapter = new OllamaAdapter()
      const result = await adapter.complete('say hello')

      expect(result).toBe('hello world')
    })

    it('sends correct request body', async () => {
      mockFetch.mockResolvedValue(
        makeResponse({ response: 'ok', done: true })
      )

      const adapter = new OllamaAdapter('http://localhost:11434', 'llama3')
      await adapter.complete('test prompt', { temperature: 0.5, maxTokens: 100 })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.prompt).toBe('test prompt')
      expect(callBody.model).toBe('llama3')
      expect(callBody.options.temperature).toBe(0.5)
      expect(callBody.options.num_predict).toBe(100)
    })

    it('throws LLMRequestError when response is not ok', async () => {
      mockFetch.mockResolvedValue(makeResponse({}, false, 500))

      const adapter = new OllamaAdapter()
      await expect(adapter.complete('test')).rejects.toBeInstanceOf(LLMRequestError)
    })

    it('throws LLMRequestError on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

      const adapter = new OllamaAdapter()
      await expect(adapter.complete('test')).rejects.toBeInstanceOf(LLMRequestError)
    })

    it('throws LLMResponseParseError when response shape is invalid', async () => {
      mockFetch.mockResolvedValue(
        makeResponse({ unexpected: 'shape' })
      )

      const adapter = new OllamaAdapter()
      await expect(adapter.complete('test')).rejects.toBeInstanceOf(LLMResponseParseError)
    })

    it('uses model from options when provided', async () => {
      mockFetch.mockResolvedValue(
        makeResponse({ response: 'ok', done: true })
      )

      const adapter = new OllamaAdapter('http://localhost:11434', 'llama3')
      await adapter.complete('test', { model: 'qwen2.5-coder:1.5b' })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.model).toBe('qwen2.5-coder:1.5b')
    })
  })
})
