import type { ClassifiedFile } from '../scanner.types'
import type { ArchitectureSignals } from '@/shared/types'

const CI_PATTERNS = [
  '.github',
  '.gitlab-ci.yml',
  'Jenkinsfile',
  '.circleci',
  '.travis.yml',
]

const CONFIG_PATTERNS = [
  'tsconfig',
  'eslint',
  'prettier',
  'vitest',
  'jest',
  '.editorconfig',
]

const MONOREPO_PATTERNS = [
  'packages',
  'apps',
  'libs',
  'services',
]

function computeMaxDepth(files: ClassifiedFile[]): number {
  return files.reduce((max, f) => {
    const depth = f.relativePath.split('/').length - 1
    return depth > max ? depth : max
  }, 0)
}

function computeTopLevelFolders(files: ClassifiedFile[]): string[] {
  const folders = new Set(
    files
      .map((f) => f.relativePath.split('/')[0])
      .filter((p) => p && !p.includes('.'))
  )
  return Array.from(folders).sort()
}

function computeSrcSubFolders(files: ClassifiedFile[]): string[] {
  const folders = new Set(
    files
      .filter((f) => f.relativePath.startsWith('src/'))
      .map((f) => {
        const parts = f.relativePath.split('/')
        return parts.length > 2 ? parts[1] : null
      })
      .filter((p): p is string => p !== null)
  )
  return Array.from(folders).sort()
}

function computeIsFlatStructure(files: ClassifiedFile[]): boolean {
  const srcFiles = files.filter((f) => f.relativePath.startsWith('src/'))
  if (srcFiles.length === 0) return false

  const filesWithSubfolders = srcFiles.filter((f) => {
    const parts = f.relativePath.split('/')
    return parts.length > 2
  })

  // flat if less than 20% of src files are in subfolders
  return filesWithSubfolders.length / srcFiles.length < 0.2
}

export function computeArchitectureSignals(
  files: ClassifiedFile[]
): ArchitectureSignals {
  const topLevelFolders = computeTopLevelFolders(files)

  const isMonorepo = MONOREPO_PATTERNS.some((p) =>
    topLevelFolders.includes(p)
  )

  const hasCIConfig = files.some((f) =>
    CI_PATTERNS.some((p) => f.relativePath.includes(p))
  )

  const configFiles = files
    .filter((f) =>
      CONFIG_PATTERNS.some((p) => f.name.toLowerCase().includes(p))
    )
    .map((f) => f.relativePath)

  return {
    topLevelFolders,
    srcSubFolders: computeSrcSubFolders(files),
    maxDepth: computeMaxDepth(files),
    hasBarrelExports: files.some((f) => f.name === 'index.ts'),
    hasCIConfig,
    configFiles,
    isMonorepo,
    isFlatStructure: computeIsFlatStructure(files),
  }
}
