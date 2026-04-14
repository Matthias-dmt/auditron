import type { ClassifiedFile } from '../scanner.types'
import type { ComplexitySignals } from '@/shared/types'

export function computeComplexitySignals(
  files: ClassifiedFile[],
  sampledFilesCount: number,
  largeFileThreshold: number
): ComplexitySignals {
  const largeFiles = files
    .filter((f) => f.lineCount > largeFileThreshold)
    .map((f) => ({ relativePath: f.relativePath, lineCount: f.lineCount }))
    .sort((a, b) => b.lineCount - a.lineCount)

  const totalLines = files.reduce((sum, f) => sum + f.lineCount, 0)
  const averageFileSize =
    files.length > 0 ? Math.round(totalLines / files.length) : 0

  return {
    largeFiles,
    averageFileSize,
    totalFiles: files.length,
    sampledFilesCount,
  }
}
