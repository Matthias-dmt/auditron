import { AgentRole } from "./agent.types"

export interface AuditConfig {
  agents?: AgentRole[]
  maxFilesToSample?: number                
  model?: string
  outputDir?: string
  maxTokensPerChunk?: number         
}
