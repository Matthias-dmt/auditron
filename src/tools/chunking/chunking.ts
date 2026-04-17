import type { IndexedFile } from '@/shared/types'

const SAFETY_MARGIN = 0.8

export interface Chunk {
  files: IndexedFile[]
  estimatedTokens: number
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function chunkFiles(
  files: IndexedFile[],
  maxTokensPerChunk: number
): Chunk[] {
  const safeLimit = Math.floor(maxTokensPerChunk * SAFETY_MARGIN)
  const chunks: Chunk[] = []
  let currentChunk: IndexedFile[] = []
  let currentTokens = 0

  for (const file of files) {
    const fileTokens = file.estimatedTokens

    if (fileTokens > safeLimit) {
      if (currentChunk.length > 0) {
        chunks.push({ files: currentChunk, estimatedTokens: currentTokens })
        currentChunk = []
        currentTokens = 0
      }

      const lines = file.content.split('\n')
      const halfPoint = Math.floor(lines.length / 2)

      const parts: IndexedFile[] = [
        {
          ...file,
          content: lines.slice(0, halfPoint).join('\n'),
          estimatedTokens: estimateTokens(lines.slice(0, halfPoint).join('\n')),
        },
        {
          ...file,
          content: lines.slice(halfPoint).join('\n'),
          estimatedTokens: estimateTokens(lines.slice(halfPoint).join('\n')),
        },
      ]

      for (const part of parts) {
        if (currentTokens + part.estimatedTokens > safeLimit) {
          chunks.push({ files: currentChunk, estimatedTokens: currentTokens })
          currentChunk = []
          currentTokens = 0
        }
        currentChunk.push(part)
        currentTokens += part.estimatedTokens
      }
      continue
    }

    if (currentTokens + fileTokens > safeLimit) {
      chunks.push({ files: currentChunk, estimatedTokens: currentTokens })
      currentChunk = []
      currentTokens = 0
    }

    currentChunk.push(file)
    currentTokens += fileTokens
  }

  if (currentChunk.length > 0) {
    chunks.push({ files: currentChunk, estimatedTokens: currentTokens })
  }

  return chunks
}
