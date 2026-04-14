import { describe, it, expect } from 'vitest'
import { computeTestSignals } from './test.signal'
import type { ClassifiedFile } from '../scanner.types'

function makeFile(relativePath: string): ClassifiedFile {
  return {
    absolutePath: `/root/${relativePath}`,
    relativePath,
    name: relativePath.split('/').pop()!,
    sizeBytes: 100,
    lineCount: 50,
    tier: 2,
  }
}

describe('computeTestSignals', () => {
  it('returns no tests when there are none', () => {
    const files = [makeFile('src/index.ts'), makeFile('src/auth/login.ts')]
    const result = computeTestSignals(files)

    expect(result.hasTests).toBe(false)
    expect(result.testFiles).toHaveLength(0)
    expect(result.testToSourceRatio).toBe(0)
  })

  it('detects test files correctly', () => {
    const files = [
      makeFile('src/index.ts'),
      makeFile('src/index.test.ts'),
    ]
    const result = computeTestSignals(files)

    expect(result.hasTests).toBe(true)
    expect(result.testFiles).toContain('src/index.test.ts')
  })

  it('computes test to source ratio correctly', () => {
    const files = [
      makeFile('src/a.ts'),
      makeFile('src/b.ts'),
      makeFile('src/a.test.ts'),
    ]
    const result = computeTestSignals(files)

    expect(result.testToSourceRatio).toBe(0.5)
  })

  it('identifies untested source files', () => {
    const files = [
      makeFile('src/a.ts'),
      makeFile('src/b.ts'),
      makeFile('src/a.test.ts'),
    ]
    const result = computeTestSignals(files)

    expect(result.largestUntestedFiles).toContain('src/b.ts')
    expect(result.largestUntestedFiles).not.toContain('src/a.ts')
  })

  it('detects vitest as test framework', () => {
    const files = [
      makeFile('vitest.config.ts'),
      makeFile('src/a.test.ts'),
    ]
    const result = computeTestSignals(files)

    expect(result.testFramework).toBe('vitest')
  })

  it('returns null framework when unknown', () => {
    const files = [makeFile('src/a.test.ts')]
    const result = computeTestSignals(files)

    expect(result.testFramework).toBeNull()
  })
})
