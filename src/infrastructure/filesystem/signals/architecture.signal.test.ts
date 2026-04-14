import { describe, it, expect } from 'vitest'
import { computeArchitectureSignals } from './architecture.signal'
import type { ClassifiedFile } from '../scanner.types'

function makeFile(relativePath: string): ClassifiedFile {
  return {
    absolutePath: `/root/${relativePath}`,
    relativePath,
    name: relativePath.split('/').pop()!,
    sizeBytes: 100,
    lineCount: 50,
    tier: 2,
  }
}

describe('computeArchitectureSignals', () => {
  describe('topLevelFolders', () => {
    it('detects top level folders', () => {
      const files = [
        makeFile('src/index.ts'),
        makeFile('scripts/deploy.ts'),
        makeFile('tests/auth.test.ts'),
      ]
      const result = computeArchitectureSignals(files)

      expect(result.topLevelFolders).toContain('src')
      expect(result.topLevelFolders).toContain('scripts')
      expect(result.topLevelFolders).toContain('tests')
    })

    it('does not include files at root level as folders', () => {
      const files = [makeFile('package.json'), makeFile('src/index.ts')]
      const result = computeArchitectureSignals(files)

      expect(result.topLevelFolders).not.toContain('package.json')
    })
  })

  describe('srcSubFolders', () => {
    it('detects direct subfolders of src', () => {
      const files = [
        makeFile('src/auth/login.ts'),
        makeFile('src/db/queries.ts'),
      ]
      const result = computeArchitectureSignals(files)

      expect(result.srcSubFolders).toContain('auth')
      expect(result.srcSubFolders).toContain('db')
    })

    it('does not include files directly in src/', () => {
      const files = [makeFile('src/index.ts')]
      const result = computeArchitectureSignals(files)

      expect(result.srcSubFolders).toHaveLength(0)
    })
  })

  describe('maxDepth', () => {
    it('computes correct max depth', () => {
      const files = [
        makeFile('src/auth/login.ts'),               // depth 2
        makeFile('src/auth/strategies/jwt.ts'),      // depth 3
      ]
      const result = computeArchitectureSignals(files)

      expect(result.maxDepth).toBe(3)
    })
  })

  describe('isMonorepo', () => {
    it('detects monorepo with packages folder', () => {
      const files = [makeFile('packages/api/src/index.ts')]
      const result = computeArchitectureSignals(files)

      expect(result.isMonorepo).toBe(true)
    })

    it('detects monorepo with apps folder', () => {
      const files = [makeFile('apps/web/src/index.ts')]
      const result = computeArchitectureSignals(files)

      expect(result.isMonorepo).toBe(true)
    })

    it('returns false for regular repo', () => {
      const files = [makeFile('src/index.ts')]
      const result = computeArchitectureSignals(files)

      expect(result.isMonorepo).toBe(false)
    })
  })

  describe('isFlatStructure', () => {
    it('detects flat structure when most files are directly in src/', () => {
      const files = [
        makeFile('src/index.ts'),
        makeFile('src/server.ts'),
        makeFile('src/routes.ts'),
        makeFile('src/helpers.ts'),
        makeFile('src/utils.ts'),
      ]
      const result = computeArchitectureSignals(files)

      expect(result.isFlatStructure).toBe(true)
    })

    it('returns false when files are spread across subfolders', () => {
      const files = [
        makeFile('src/auth/login.ts'),
        makeFile('src/auth/logout.ts'),
        makeFile('src/db/queries.ts'),
        makeFile('src/routes/users.ts'),
        makeFile('src/routes/products.ts'),
      ]
      const result = computeArchitectureSignals(files)

      expect(result.isFlatStructure).toBe(false)
    })
  })

  describe('hasCIConfig', () => {
    it('detects github actions', () => {
      const files = [makeFile('.github/workflows/ci.yml')]
      const result = computeArchitectureSignals(files)

      expect(result.hasCIConfig).toBe(true)
    })

    it('returns false when no CI config found', () => {
      const files = [makeFile('src/index.ts')]
      const result = computeArchitectureSignals(files)

      expect(result.hasCIConfig).toBe(false)
    })
  })

  describe('hasBarrelExports', () => {
    it('detects index.ts as barrel export', () => {
      const files = [makeFile('src/auth/index.ts')]
      const result = computeArchitectureSignals(files)

      expect(result.hasBarrelExports).toBe(true)
    })

    it('returns false when no index.ts found', () => {
      const files = [makeFile('src/auth/login.ts')]
      const result = computeArchitectureSignals(files)

      expect(result.hasBarrelExports).toBe(false)
    })
  })

  describe('configFiles', () => {
    it('detects common config files', () => {
      const files = [
        makeFile('tsconfig.json'),
        makeFile('eslint.config.js'),
        makeFile('vitest.config.ts'),
      ]
      const result = computeArchitectureSignals(files)

      expect(result.configFiles).toContain('tsconfig.json')
      expect(result.configFiles).toContain('eslint.config.js')
      expect(result.configFiles).toContain('vitest.config.ts')
    })
  })
})
