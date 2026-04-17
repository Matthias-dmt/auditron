import { describe, it, expect, vi } from 'vitest'
import { runOrchestrator } from './orchestrator'
import type { CodebaseIndex, SpecialistReport, AgentRole } from '@/shared/types'
import type { Agent } from '@/agents/agent'

function makeIndex(): CodebaseIndex {
  return {
    rootPath: '/my-app',
    fileTree: [],
    coreFiles: [],
    sampledFiles: [],
    failedReads: [],
    shape: {
      framework: 'unknown',
      architecturePattern: 'unknown',
      packageManager: 'pnpm',
      language: 'typescript',
      entryPoints: [],
      unusualPatterns: [],
      specialistGuidance: {},
    },
    signals: {
      tests: {
        hasTests: false,
        testFiles: [],
        sourceFiles: [],
        testToSourceRatio: 0,
        largestUntestedFiles: [],
        testFramework: null,
      },
      dependencies: {
        direct: {},
        dev: {},
        lockfilePresent: false,
        totalDependencies: 0,
      },
      complexity: {
        largeFiles: [],
        averageFileSize: 0,
        totalFiles: 0,
        sampledFilesCount: 0,
      },
      security: {
        sensitivePathCandidates: [],
        hasEnvExample: false,
        hasDotEnv: false,
      },
      architecture: {
        topLevelFolders: [],
        srcSubFolders: [],
        maxDepth: 0,
        hasBarrelExports: false,
        hasCIConfig: false,
        configFiles: [],
        isMonorepo: false,
        isFlatStructure: false,
      },
    },
  }
}

function makeAgent(role: AgentRole, report: Partial<SpecialistReport> = {}): Agent {
  return {
    role,
    run: vi.fn().mockResolvedValue({
      agent: role,
      status: 'success' as const,
      findings: [],
      summary: 'ok',
      healthScore: 80,
      chunksProcessed: 1,
      rawLLMOutput: [],
      ...report,
    }),
  }
}

function makeFailingAgent(role: AgentRole, error: string): Agent {
  return {
    role,
    run: vi.fn().mockRejectedValue(new Error(error)),
  }
}

describe('runOrchestrator', () => {
  it('runs all agents and returns their reports', async () => {
    const agents = [
      makeAgent('security'),
      makeAgent('techDebt'),
    ]

    const results = await runOrchestrator(makeIndex(), agents)

    expect(results).toHaveLength(2)
    expect(results[0].agent).toBe('security')
    expect(results[1].agent).toBe('techDebt')
  })

  it('returns failed report when agent throws', async () => {
    const agents = [makeFailingAgent('security', 'LLM timeout')]

    const results = await runOrchestrator(makeIndex(), agents)

    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('failed')
    expect(results[0].error).toBe('LLM timeout')
    expect(results[0].findings).toHaveLength(0)
  })

  it('continues when one agent fails and others succeed', async () => {
    const agents = [
      makeFailingAgent('security', 'timeout'),
      makeAgent('techDebt'),
      makeAgent('architecture'),
    ]

    const results = await runOrchestrator(makeIndex(), agents)

    expect(results).toHaveLength(3)
    expect(results[0].status).toBe('failed')
    expect(results[1].status).toBe('success')
    expect(results[2].status).toBe('success')
  })

  it('only runs agents specified in config', async () => {
    const agents = [
      makeAgent('security'),
      makeAgent('techDebt'),
      makeAgent('architecture'),
    ]

    const results = await runOrchestrator(makeIndex(), agents, {
      agents: ['security'],
    })

    expect(results).toHaveLength(1)
    expect(results[0].agent).toBe('security')
  })

  it('runs default agents when config has no agents specified', async () => {
    const agents = [
      makeAgent('security'),
      makeAgent('techDebt'),
      makeAgent('architecture'),
      makeAgent('dependency'),
    ]

    const results = await runOrchestrator(makeIndex(), agents, {})

    expect(results).toHaveLength(4)
  })

  it('returns empty array when no agents match config', async () => {
    const agents = [makeAgent('security')]

    const results = await runOrchestrator(makeIndex(), agents, {
      agents: ['techDebt'],
    })

    expect(results).toHaveLength(0)
  })
})
