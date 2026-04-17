import { describe, it, expect } from 'vitest'
import { chunkFiles, estimateTokens } from './chunking'
import type { IndexedFile } from '@/shared/types'

function makeFile(path: string, content: string): IndexedFile {
  return {
    path,
    relativePath: path,
    language: 'typescript',
    content,
    sizeBytes: content.length,
    lineCount: content.split('\n').length,
    estimatedTokens: estimateTokens(content),
  }
}

describe('estimateTokens', () => {
  it('estimates tokens as chars divided by 4', () => {
    expect(estimateTokens('abcd')).toBe(1)
    expect(estimateTokens('a'.repeat(400))).toBe(100)
  })
})

describe('chunkFiles', () => {
  it('returns empty array for empty input', () => {
    expect(chunkFiles([], 1000)).toEqual([])
  })

  it('returns single chunk when files fit within safe limit', () => {
    const files = [
      makeFile('a.ts', 'a'.repeat(100)),
      makeFile('b.ts', 'b'.repeat(100)),
    ]
    const chunks = chunkFiles(files, 1000)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].files).toHaveLength(2)
  })

  it('splits into multiple chunks when safe limit is exceeded', () => {
    const files = [
      makeFile('a.ts', 'a'.repeat(800)),
      makeFile('b.ts', 'b'.repeat(800)),
      makeFile('c.ts', 'c'.repeat(800)),
    ]
    const chunks = chunkFiles(files, 500)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('splits a single file larger than safe limit by lines', () => {
    const lines = Array.from({ length: 100 }, (_, i) => `const x${i} = ${i}`)
    const files = [makeFile('big.ts', lines.join('\n'))]
    const chunks = chunkFiles(files, 50)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('respects the 80% safety margin', () => {
    const files = [makeFile('a.ts', 'a'.repeat(400))]
    // 400 chars = 100 tokens, safe limit of 500 * 0.8 = 400 tokens — should fit
    const chunks = chunkFiles(files, 500)
    expect(chunks).toHaveLength(1)
  })
})
