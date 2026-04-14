import type { AgentRole } from './agent.types'
import type { Finding } from './finding.types'
import type { ProjectShape } from './codebase.types'

export interface SpecialistReport {
  agent: AgentRole
  findings: Finding[]
  summary: string
  healthScore: number                    
  chunksProcessed: number
  rawLLMOutput: string[]
}          

export interface AuditResult {
  codebasePath: string
  timestamp: string
  overallHealthScore: number
  shape: ProjectShape
  reports: SpecialistReport[]
  prioritisedFindings: Finding[]                
  executiveSummary: string
}

