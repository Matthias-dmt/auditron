import { AuditronError } from './base.error'

export class ConfigError extends AuditronError {
  constructor(message: string, cause?: unknown) {
    super(message, cause)
  }
}
