import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs/promises'
import type { Dirent } from 'fs'
import { scanCodebase } from './scanner'

vi.mock('fs/promises')

const mockedFs = vi.mocked(fs)

function makeDirent(name: string, isDir: boolean): Pick<Dirent, 'name' | 'isDirectory' | 'isFile'> {
  return {
    name,
    isDirectory: () => isDir,
    isFile: () => !isDir,
  }
}

describe('scanCodebase', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })
  it('excludes node_modules from file tree', async () => {
    mockedFs.readdir.mockImplementation(async (dirPath) => {
      if (dirPath.toString().endsWith('my-app')) {
        return [
          makeDirent('node_modules', true),
          makeDirent('src', true),
          makeDirent('package.json', false),
        ] as any
      }
      if (dirPath.toString().endsWith('src')) {
        return [makeDirent('index.ts', false)] as any
      }
      return [] as any
    })

    mockedFs.stat.mockResolvedValue({ size: 100 } as any)
    mockedFs.readFile.mockResolvedValue('const x = 1\n' as any)

    const result = await scanCodebase('/my-app')

    const names = result.fileTree.map((n) => n.name)
    expect(names).not.toContain('node_modules')
    expect(names).toContain('src')
    expect(names).toContain('package.json')
  })

  it('produces coreFiles from tier 1 and 2 files', async () => {
    mockedFs.readdir.mockImplementation(async (dirPath) => {
      if (dirPath.toString().endsWith('my-app')) {
        return [
          makeDirent('package.json', false),
          makeDirent('src', true),
        ] as any
      }
      if (dirPath.toString().endsWith('src')) {
        return [makeDirent('index.ts', false)] as any
      }
      return [] as any
    })

    mockedFs.stat.mockResolvedValue({ size: 100 } as any)
    mockedFs.readFile.mockResolvedValue('const x = 1\n' as any)

    const result = await scanCodebase('/my-app')

    expect(result.coreFiles.length).toBeGreaterThan(0)
  })

  it('does not crash when a file cannot be read', async () => {
    mockedFs.readdir.mockImplementation(async (dirPath) => {
      if (dirPath.toString().endsWith('my-app')) {
        return [
          makeDirent('package.json', false),
          makeDirent('broken.ts', false),
        ] as any
      }
      return [] as any
    })

    mockedFs.stat.mockResolvedValue({ size: 100 } as any)
    mockedFs.readFile.mockImplementation(async (filePath) => {
      if (filePath.toString().includes('broken')) {
        throw new Error('Permission denied')
      }
      return 'const x = 1\n' as any
    })

    await expect(scanCodebase('/my-app')).resolves.toBeDefined()
  })

  it('computes dependency signals from package.json', async () => {
    mockedFs.readdir.mockResolvedValue([
      makeDirent('package.json', false),
    ] as any)

    mockedFs.stat.mockResolvedValue({ size: 200 } as any)
    mockedFs.readFile.mockResolvedValue(
      JSON.stringify({
        dependencies: { express: '^4.18.0' },
        devDependencies: { typescript: '^5.0.0' },
      }) as any
    )

    const result = await scanCodebase('/my-app')

    expect(result.signals.dependencies.direct).toEqual({ express: '^4.18.0' })
    expect(result.signals.dependencies.totalDependencies).toBe(2)
  })
})
