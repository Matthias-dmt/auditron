import { describe, it, expect } from 'vitest'
import { computeSecuritySignals } from './security.signal'
import type { ClassifiedFile } from '../scanner.types'
import type { IndexedFile } from '@/shared/types'

function makeClassifiedFile(relativePath: string): ClassifiedFile {
  return {
    absolutePath: `/root/${relativePath}`,
    relativePath,
    name: relativePath.split('/').pop()!,
    sizeBytes: 100,
    lineCount: 50,
    tier: 2,
  }
}

function makeIndexedFile(relativePath: string, content: string): IndexedFile {
  return {
    path: `/root/${relativePath}`,
    relativePath,
    language: 'typescript',
    content,
    sizeBytes: content.length,
    lineCount: content.split('\n').length,
    estimatedTokens: Math.ceil(content.length / 4),
  }
}

describe('computeSecuritySignals', () => {
  describe('path scanning', () => {
    it('detects sensitive path candidates by filename', () => {
      const files = [
        makeClassifiedFile('src/auth/login.ts'),
        makeClassifiedFile('src/db/queries.ts'),
        makeClassifiedFile('src/utils/date.ts'),
      ]
      const result = computeSecuritySignals(files, [])

      expect(result.sensitivePathCandidates).toContain('src/auth/login.ts')
      expect(result.sensitivePathCandidates).toContain('src/db/queries.ts')
      expect(result.sensitivePathCandidates).not.toContain('src/utils/date.ts')
    })

    it('is case insensitive when matching path keywords', () => {
      const files = [makeClassifiedFile('src/AUTH/Login.ts')]
      const result = computeSecuritySignals(files, [])

      expect(result.sensitivePathCandidates).toContain('src/AUTH/Login.ts')
    })
  })

  describe('content scanning', () => {
    it('detects files with jwt imports regardless of path name', () => {
      const files = [makeClassifiedFile('src/helpers.ts')]
      const coreFiles = [
        makeIndexedFile('src/helpers.ts', `import jwt from 'jsonwebtoken'`),
      ]
      const result = computeSecuritySignals(files, coreFiles)

      expect(result.sensitivePathCandidates).toContain('src/helpers.ts')
    })

    it('detects files with bcrypt usage', () => {
      const files = [makeClassifiedFile('src/utils/user.ts')]
      const coreFiles = [
        makeIndexedFile('src/utils/user.ts', `import bcrypt from 'bcrypt'`),
      ]
      const result = computeSecuritySignals(files, coreFiles)

      expect(result.sensitivePathCandidates).toContain('src/utils/user.ts')
    })

    it('detects process.env usage', () => {
      const files = [makeClassifiedFile('src/config.ts')]
      const coreFiles = [
        makeIndexedFile('src/config.ts', `const secret = process.env.SECRET_KEY`),
      ]
      const result = computeSecuritySignals(files, coreFiles)

      expect(result.sensitivePathCandidates).toContain('src/config.ts')
    })

    it('does not flag files with no sensitive content', () => {
      const files = [makeClassifiedFile('src/utils/date.ts')]
      const coreFiles = [
        makeIndexedFile('src/utils/date.ts', `export function formatDate(d: Date) { return d.toISOString() }`),
      ]
      const result = computeSecuritySignals(files, coreFiles)

      expect(result.sensitivePathCandidates).not.toContain('src/utils/date.ts')
    })
  })

  describe('deduplication', () => {
    it('does not duplicate files that match both path and content', () => {
      const files = [makeClassifiedFile('src/auth/login.ts')]
      const coreFiles = [
        makeIndexedFile('src/auth/login.ts', `import jwt from 'jsonwebtoken'`),
      ]
      const result = computeSecuritySignals(files, coreFiles)

      const count = result.sensitivePathCandidates.filter(
        (p) => p === 'src/auth/login.ts'
      ).length
      expect(count).toBe(1)
    })
  })

  describe('env file detection', () => {
    it('detects .env.example presence', () => {
      const files = [makeClassifiedFile('.env.example')]
      const result = computeSecuritySignals(files, [])

      expect(result.hasEnvExample).toBe(true)
    })

    it('detects .env presence', () => {
      const files = [makeClassifiedFile('.env')]
      const result = computeSecuritySignals(files, [])

      expect(result.hasDotEnv).toBe(true)
    })

    it('returns false for env flags when neither file exists', () => {
      const files = [makeClassifiedFile('src/index.ts')]
      const result = computeSecuritySignals(files, [])

      expect(result.hasEnvExample).toBe(false)
      expect(result.hasDotEnv).toBe(false)
    })
  })
})
