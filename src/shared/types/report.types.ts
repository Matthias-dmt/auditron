import { AgentRole } from './agent.types'
import { Finding } from './finding.types'
import { ProjectShape } from './codebase.types'

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

