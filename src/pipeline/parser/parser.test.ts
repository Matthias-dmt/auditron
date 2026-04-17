import { describe, it, expect, vi } from 'vitest'
import { runParser } from './parser'
import { LLMResponseParseError } from '@/shared/errors'
import type { RawCodebaseData } from '@/shared/types'
import type { LLMAdapter } from '@/infrastructure/llm/adapter'

function makeMockLLM(response: string): LLMAdapter{
  return {
    complete: vi.fn().mockResolvedValue(response),
  }
}

function makeRawData(): RawCodebaseData {
  return {
    rootPath: '/my-app',
    fileTree: [],
    coreFiles: [],
    sampledFiles: [],
    failedReads: [],
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
        topLevelFolders: ['src'],
        srcSubFolders: ['auth', 'db'],
        maxDepth: 3,
        hasBarrelExports: true,
        hasCIConfig: false,
        configFiles: ['tsconfig.json'],
        isMonorepo: false,
        isFlatStructure: false,
      },
    },
  }
}

const validShape = {
  framework: 'Express.js',
  architecturePattern: 'layered monolith',
  packageManager: 'pnpm',
  language: 'typescript',
  entryPoints: ['src/index.ts'],
  unusualPatterns: [],
  specialistGuidance: {
    security: 'focus on auth/ folder',
  },
}

describe('runParser', () => {
  it('returns CodebaseIndex with shape on valid LLM response', async () => {
    const llm = makeMockLLM(JSON.stringify(validShape))
    const result = await runParser(makeRawData(), llm)

    expect(result.shape.framework).toBe('Express.js')
    expect(result.shape.architecturePattern).toBe('layered monolith')
    expect(result.shape.specialistGuidance.security).toBe('focus on auth/ folder')
  })

  it('merges raw data into the returned CodebaseIndex', async () => {
    const llm = makeMockLLM(JSON.stringify(validShape))
    const data = makeRawData()
    const result = await runParser(data, llm)

    expect(result.rootPath).toBe(data.rootPath)
    expect(result.signals).toEqual(data.signals)
  })

  it('throws LLMResponseParseError when LLM returns invalid JSON', async () => {
    const llm = makeMockLLM('not valid json')
    await expect(runParser(makeRawData(), llm)).rejects.toBeInstanceOf(
      LLMResponseParseError
    )
  })

  it('throws LLMResponseParseError when shape is missing required fields', async () => {
    const llm = makeMockLLM(JSON.stringify({ framework: 'Express' }))
    await expect(runParser(makeRawData(), llm)).rejects.toBeInstanceOf(
      LLMResponseParseError
    )
  })

  it('passes low temperature to LLM for deterministic output', async () => {
    const llm = makeMockLLM(JSON.stringify(validShape))
    await runParser(makeRawData(), llm)

    expect(llm.complete).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ temperature: 0.1 })
    )
  })
})
