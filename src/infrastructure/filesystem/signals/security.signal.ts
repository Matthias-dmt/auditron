import type { ClassifiedFile } from '../scanner.types'
import type { SecuritySignals } from '@/shared/types'
import type { IndexedFile } from '@/shared/types'

const SENSITIVE_PATH_KEYWORDS = [
  'auth',
  'jwt',
  'password',
  'secret',
  'db',
  'sql',
  'token',
  'crypto',
  'session',
  'cookie',
  'permission',
  'role',
]

const SENSITIVE_CONTENT_PATTERNS = [
  /import\s+.*jwt/i,
  /import\s+.*bcrypt/i,
  /import\s+.*crypto/i,
  /db\.query\s*\(/i,
  /process\.env/i,
  /createHash\s*\(/i,
  /verify\s*\(.*token/i,
  /Bearer\s+/i,
  /Authorization/i,
  /\.sign\s*\(/i,
  /\.verify\s*\(/i,
  /password/i,
  /SECRET/,
]

function hasContentMatch(content: string): boolean {
  return SENSITIVE_CONTENT_PATTERNS.some((pattern) => pattern.test(content))
}

export function computeSecuritySignals(
  files: ClassifiedFile[],
  coreFiles: IndexedFile[]
): SecuritySignals {
  // Level 1 — path/filename scan
  const pathCandidates = new Set(
    files
      .filter((f) =>
        SENSITIVE_PATH_KEYWORDS.some((kw) =>
          f.relativePath.toLowerCase().includes(kw)
        )
      )
      .map((f) => f.relativePath)
  )

  // Level 2 — content scan on already loaded files
  const contentCandidates = new Set(
    coreFiles
      .filter((f) => hasContentMatch(f.content))
      .map((f) => f.relativePath)
  )

  // merge both sets
  const sensitivePathCandidates = Array.from(
    new Set([...pathCandidates, ...contentCandidates])
  )

  const hasEnvExample = files.some((f) => f.name === '.env.example')
  const hasDotEnv = files.some((f) => f.name === '.env')

  return {
    sensitivePathCandidates,
    hasEnvExample,
    hasDotEnv,
  }
}
