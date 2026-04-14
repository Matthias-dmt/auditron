import { describe, it, expect } from 'vitest'
import { computeDependencySignals } from './dependency.signal'
import type { ClassifiedFile } from '../scanner.types'

function makeFile(name: string): ClassifiedFile {
  return {
    absolutePath: `/root/${name}`,
    relativePath: name,
    name,
    sizeBytes: 100,
    lineCount: 10,
    tier: 1,
  }
}

describe('computeDependencySignals', () => {
  it('returns empty signals when packageJson is null', () => {
    const result = computeDependencySignals([], null)

    expect(result.direct).toEqual({})
    expect(result.dev).toEqual({})
    expect(result.totalDependencies).toBe(0)
    expect(result.lockfilePresent).toBe(false)
  })

  it('extracts direct and dev dependencies', () => {
    const packageJson = {
      dependencies: { express: '^4.18.0', pg: '^8.11.0' },
      devDependencies: { typescript: '^5.0.0' },
    }
    const result = computeDependencySignals([], packageJson)

    expect(result.direct).toEqual({ express: '^4.18.0', pg: '^8.11.0' })
    expect(result.dev).toEqual({ typescript: '^5.0.0' })
    expect(result.totalDependencies).toBe(3)
  })

  it('detects pnpm lockfile', () => {
    const files = [makeFile('pnpm-lock.yaml')]
    const result = computeDependencySignals(files, null)

    expect(result.lockfilePresent).toBe(true)
  })

  it('detects yarn lockfile', () => {
    const files = [makeFile('yarn.lock')]
    const result = computeDependencySignals(files, null)

    expect(result.lockfilePresent).toBe(true)
  })

  it('returns false when no lockfile present', () => {
    const files = [makeFile('package.json')]
    const result = computeDependencySignals(files, null)

    expect(result.lockfilePresent).toBe(false)
  })

  it('handles missing dependencies fields gracefully', () => {
    const packageJson = { name: 'my-app', version: '1.0.0' }
    const result = computeDependencySignals([], packageJson)

    expect(result.direct).toEqual({})
    expect(result.dev).toEqual({})
    expect(result.totalDependencies).toBe(0)
  })
})