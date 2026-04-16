import type { ClassifiedFile } from '../scanner.types'
import type { ComplexitySignals } from '@/shared/types'

const EXCLUDED_FROM_COMPLEXITY = new Set([
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  'bun.lockb',
])

export function computeComplexitySignals(
  files: ClassifiedFile[],
  sampledFilesCount: number,
  largeFileThreshold: number
): ComplexitySignals {

  const relevantFiles = files.filter(
    (f) => !EXCLUDED_FROM_COMPLEXITY.has(f.name)
  )

  const largeFiles = relevantFiles
    .filter((f) => f.lineCount > largeFileThreshold)
    .map((f) => ({ relativePath: f.relativePath, lineCount: f.lineCount }))
    .sort((a, b) => b.lineCount - a.lineCount)

  const totalLines = relevantFiles.reduce((sum, f) => sum + f.lineCount, 0)
  const averageFileSize =
    relevantFiles.length > 0 ? Math.round(totalLines / relevantFiles.length) : 0

  return {
    largeFiles,
    averageFileSize,
    totalFiles: files.length,
    sampledFilesCount,
  }
}
