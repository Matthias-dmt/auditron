import * as path from 'path'
import { TIER2_EXTENSIONS, TIER3_PATTERNS } from '../scanner.types'
import type { ClassifiedFile } from '../scanner.types'
import type { TestSignals } from '@/shared/types'

export function computeTestSignals(files: ClassifiedFile[]): TestSignals {
  const sourceFiles = files
    .filter((f) => TIER2_EXTENSIONS.has(path.extname(f.name)))
    .filter((f) => !TIER3_PATTERNS.some((p) => p.test(f.name)))
    .map((f) => f.relativePath)

  const testFiles = files
    .filter((f) => TIER3_PATTERNS.some((p) => p.test(f.name)))
    .map((f) => f.relativePath)

  const allPaths = files.map((f) => f.relativePath).join(' ')
  const testFramework =
    allPaths.includes('vitest') ? 'vitest'
    : allPaths.includes('jest') ? 'jest'
    : null

  const testedBasenames = new Set(
    testFiles.map((f) =>
      path.basename(f).replace(/\.(test|spec)\.(ts|js|tsx|jsx)$/, '')
    )
  )

  const largestUntestedFiles = sourceFiles
    .filter(
      (f) =>
        !testedBasenames.has(
          path.basename(f).replace(/\.(ts|js|tsx|jsx)$/, '')
        )
    )
    .slice(0, 10)

  return {
    hasTests: testFiles.length > 0,
    testFiles,
    sourceFiles,
    testToSourceRatio:
      sourceFiles.length > 0
        ? Math.round((testFiles.length / sourceFiles.length) * 100) / 100
        : 0,
    largestUntestedFiles,
    testFramework,
  }
}
