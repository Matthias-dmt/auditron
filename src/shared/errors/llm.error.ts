import { AuditronError } from './base.error'

export class LLMError extends AuditronError {}

export class LLMRequestError extends LLMError {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    cause?: unknown
  ) {
    super(`LLM request failed: ${status} ${statusText}`, cause)
  }
}

export class LLMResponseParseError extends LLMError {
  constructor(cause?: unknown) {
    super('Failed to parse LLM response', cause)
  }
}
