import type { AgentRole } from './agent.types'
import type { Finding } from './finding.types'
import type { ProjectShape } from './codebase.types'

export type SpecialistStatus = 'success' | 'failed'

export interface SpecialistReport {
  agent: AgentRole
  findings: Finding[],
  status: SpecialistStatus
  summary: string
  healthScore: number                    
  chunksProcessed: number
  rawLLMOutput: string[],
  error?: string  
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

