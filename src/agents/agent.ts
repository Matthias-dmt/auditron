import type { CodebaseIndex, SpecialistReport, AgentRole } from '@/shared/types'

export interface Agent {
  role: AgentRole
  run: (index: CodebaseIndex) => Promise<SpecialistReport>
}
