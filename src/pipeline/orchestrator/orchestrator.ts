import type { CodebaseIndex, AuditConfig, SpecialistReport, AgentRole } from '@/shared/types'
import type { Agent } from '@/agents/agent'

const DEFAULT_AGENTS: AgentRole[] = [
  'security',
  'techDebt',
  'architecture',
  'dependency',
]

function buildFailedReport(role: AgentRole, err: unknown): SpecialistReport {
  return {
    agent: role,
    status: 'failed',
    findings: [],
    summary: 'Agent failed to complete analysis',
    healthScore: 0,
    chunksProcessed: 0,
    rawLLMOutput: [],
    error: err instanceof Error ? err.message : String(err),
  }
}

export async function runOrchestrator(
  index: CodebaseIndex,
  agents: Agent[],
  config: AuditConfig = {}
): Promise<SpecialistReport[]> {
  const agentsToRun = config.agents ?? DEFAULT_AGENTS

  const selectedAgents = agents.filter((a) =>
    agentsToRun.includes(a.role)
  )

  const results = await Promise.allSettled(
    selectedAgents.map((agent) => agent.run(index))
  )

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    return buildFailedReport(selectedAgents[i].role, result.reason)
  })
}
