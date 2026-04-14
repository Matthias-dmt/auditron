import { describe, it, expect } from 'vitest'
import { computeComplexitySignals } from './complexity.signal'
import type { ClassifiedFile } from '../scanner.types'

function makeFile(relativePath: string, lineCount: number): ClassifiedFile {
  return {
    absolutePath: `/root/${relativePath}`,
    relativePath,
    name: relativePath.split('/').pop()!,
    sizeBytes: lineCount * 30,
    lineCount,
    tier: 2,
  }
}

describe('computeComplexitySignals', () => {
  it('returns zeros for empty file list', () => {
    const result = computeComplexitySignals([], 0, 300)

    expect(result.totalFiles).toBe(0)
    expect(result.averageFileSize).toBe(0)
    expect(result.largeFiles).toHaveLength(0)
  })

  it('flags files above the large file threshold', () => {
    const files = [
      makeFile('src/queries.ts', 910),
      makeFile('src/helpers.ts', 430),
      makeFile('src/utils.ts', 50),
    ]
    const result = computeComplexitySignals(files, 3, 300)

    expect(result.largeFiles).toHaveLength(2)
    expect(result.largeFiles[0].relativePath).toBe('src/queries.ts')
    expect(result.largeFiles[1].relativePath).toBe('src/helpers.ts')
  })

  it('does not flag files below the threshold', () => {
    const files = [makeFile('src/utils.ts', 50)]
    const result = computeComplexitySignals(files, 1, 300)

    expect(result.largeFiles).toHaveLength(0)
  })

  it('sorts large files by line count descending', () => {
    const files = [
      makeFile('src/a.ts', 400),
      makeFile('src/b.ts', 900),
      makeFile('src/c.ts', 600),
    ]
    const result = computeComplexitySignals(files, 3, 300)

    expect(result.largeFiles[0].lineCount).toBe(900)
    expect(result.largeFiles[1].lineCount).toBe(600)
    expect(result.largeFiles[2].lineCount).toBe(400)
  })

  it('computes average file size correctly', () => {
    const files = [
      makeFile('src/a.ts', 100),
      makeFile('src/b.ts', 200),
      makeFile('src/c.ts', 300),
    ]
    const result = computeComplexitySignals(files, 3, 300)

    expect(result.averageFileSize).toBe(200)
  })

  it('tracks sampled files count separately from total', () => {
    const files = [
      makeFile('src/a.ts', 100),
      makeFile('src/b.ts', 200),
    ]
    const result = computeComplexitySignals(files, 1, 300)

    expect(result.totalFiles).toBe(2)
    expect(result.sampledFilesCount).toBe(1)
  })
})
