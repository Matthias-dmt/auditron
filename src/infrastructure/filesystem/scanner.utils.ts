import * as path from 'path'
import {
  EXCLUDED_DIRS,
  EXCLUDED_EXTENSIONS,
  EXCLUDED_FILES,
  TIER1_FILENAMES,
  TIER2_EXTENSIONS,
  TIER2_KEYWORDS,
  TIER3_PATTERNS,
  TIER4_FILENAMES,
  type FileTier,
} from './scanner.types'

export function shouldExclude(name: string): boolean {
  if (EXCLUDED_FILES.has(name)) return true
  if (EXCLUDED_DIRS.has(name)) return true
  if (name.includes('.min.')) return true

  const ext = path.extname(name)
  if (EXCLUDED_EXTENSIONS.has(ext)) return true

  return false
}

export function classifyFile(relativePath: string, name: string): FileTier {
  if (TIER4_FILENAMES.has(name)) return 4
  if (TIER1_FILENAMES.has(name)) return 1
  if (TIER3_PATTERNS.some((pattern) => pattern.test(name))) return 3

  const ext = path.extname(name)
  if (TIER2_EXTENSIONS.has(ext)) {
    const lowerPath = relativePath.toLowerCase()
    if (TIER2_KEYWORDS.some((kw) => lowerPath.includes(kw))) return 1
    return 2
  }

  return 4
}

export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath)
  const map: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.md': 'markdown',
    '.yml': 'yaml',
    '.yaml': 'yaml',
  }
  return map[ext] ?? 'unknown'
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
