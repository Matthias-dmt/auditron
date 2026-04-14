import { AuditronError } from './base.error'

export class ParserError extends AuditronError {}

export class FileReadError extends ParserError {
  constructor(public readonly filePath: string, cause?: unknown) {
    super(`Failed to read file: ${filePath}`, cause)
  }
}

export class IndexingError extends ParserError {
  constructor(cause?: unknown) {
    super('Failed to index codebase', cause)
  }
}
