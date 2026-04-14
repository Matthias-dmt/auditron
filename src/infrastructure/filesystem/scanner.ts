import * as fs from 'fs/promises'
import * as path from 'path'
import type { RawCodebaseData, IndexedFile, FileNode } from '@/shared/types'
import type { ClassifiedFile, ScannerConfig } from './scanner.types'
import { DEFAULT_SCANNER_CONFIG } from './scanner.types'
import { classifyFile, shouldExclude, detectLanguage, estimateTokens } from './scanner.utils'
import { FileReadError, IndexingError } from '@/shared/errors'
import {
  computeTestSignals,
  computeDependencySignals,
  computeComplexitySignals,
  computeSecuritySignals,
  computeArchitectureSignals,
} from './signals'

// ─── File Tree ────────────────────────────────────────────────────────────────
// allFiles accumulator is populated during the recursive build so we avoid
// a second traversal to flatten the tree into a list.

async function buildFileTree(
  dirPath: string,
  rootPath: string,
  allFiles: FileNode[]
): Promise<FileNode[]> {
  let entries

  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true })
  } catch (err) {
    throw new FileReadError(dirPath, err)
  }

  const results = await Promise.allSettled<FileNode | null>(
    entries.map(async (entry): Promise<FileNode | null> => {
      if (shouldExclude(entry.name)) return null

      const absolutePath = path.join(dirPath, entry.name)
      const relativePath = path.relative(rootPath, absolutePath)

      if (entry.isDirectory()) {
        const children = await buildFileTree(absolutePath, rootPath, allFiles)
        return {
          name: entry.name,
          relativePath,
          type: 'directory' as const,
          children,
        }
      }

      if (entry.isFile()) {
        const stat = await fs.stat(absolutePath)
        const node: FileNode = {
          name: entry.name,
          relativePath,
          type: 'file' as const,
          sizeBytes: stat.size,
        }
        allFiles.push(node)
        return node
      }

      return null
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<FileNode> =>
      r.status === 'fulfilled' && r.value !== null
    )
    .map((r) => r.value)
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ─── File Classification ──────────────────────────────────────────────────────

async function classifyFiles(
  fileNodes: FileNode[],
  rootPath: string
): Promise<ClassifiedFile[]> {
  const results = await Promise.allSettled(
    fileNodes.map(async (node) => {
      const absolutePath = path.join(rootPath, node.relativePath)
      const name = path.basename(node.relativePath)
      const tier = classifyFile(node.relativePath, name)

      // Only read content for tier 1/2 — tier 3/4 content is never used here,
      // so estimate line count from size to avoid unnecessary I/O.
      let lineCount = 0
      if (tier === 1 || tier === 2) {
        try {
          const content = await fs.readFile(absolutePath, 'utf-8')
          lineCount = content.split('\n').length
        } catch {
          lineCount = 0
        }
      } else {
        lineCount = Math.round((node.sizeBytes ?? 0) / 80)
      }

      return {
        absolutePath,
        relativePath: node.relativePath,
        name,
        sizeBytes: node.sizeBytes ?? 0,
        lineCount,
        tier,
      } satisfies ClassifiedFile
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<ClassifiedFile> =>
      r.status === 'fulfilled'
    )
    .map((r) => r.value)
}

// ─── File Reading ─────────────────────────────────────────────────────────────

interface ReadResult {
  files: IndexedFile[]
  failed: string[]  // absolute paths that could not be read
}

async function readIndexedFiles(
  classified: ClassifiedFile[],
  maxLines?: number
): Promise<ReadResult> {
  const results = await Promise.allSettled(
    classified.map(async (f) => {
      const raw = await fs.readFile(f.absolutePath, 'utf-8')
      const lines = raw.split('\n')
      const content = maxLines ? lines.slice(0, maxLines).join('\n') : raw

      return {
        path: f.absolutePath,
        relativePath: f.relativePath,
        language: detectLanguage(f.relativePath),
        content,
        sizeBytes: f.sizeBytes,
        lineCount: lines.length,
        estimatedTokens: estimateTokens(content),
      } satisfies IndexedFile
    })
  )

  const files: IndexedFile[] = []
  const failed: string[] = []

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      files.push(r.value)
    } else {
      failed.push(classified[i].absolutePath)
    }
  })

  return { files, failed }
}

// ─── Package JSON ─────────────────────────────────────────────────────────────

async function readPackageJson(
  classified: ClassifiedFile[]
): Promise<Record<string, unknown> | null> {
  const packageJsonFile = classified.find((f) => f.name === 'package.json')
  if (!packageJsonFile) return null

  try {
    const raw = await fs.readFile(packageJsonFile.absolutePath, 'utf-8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

// ─── Main Scanner ─────────────────────────────────────────────────────────────

export async function scanCodebase(
  rootPath: string,
  config: ScannerConfig = DEFAULT_SCANNER_CONFIG
): Promise<RawCodebaseData> {
  try {
    const absoluteRoot = path.resolve(rootPath)

    // Step 1 — build file tree (allFileNodes is populated during the recursive build)
    const allFileNodes: FileNode[] = []
    const fileTree = await buildFileTree(absoluteRoot, absoluteRoot, allFileNodes)

    // Step 2 — classify all files
    const classifiedFiles = await classifyFiles(allFileNodes, absoluteRoot)

    // Step 3 — read package.json
    const packageJson = await readPackageJson(classifiedFiles)

    // Step 4 — read core files (tier 1 + 2) up to sample limit
    const tier1And2 = classifiedFiles
      .filter((f) => f.tier === 1 || f.tier === 2)
      .slice(0, config.maxFilesToSample)

    const { files: coreFiles, failed: failedCore } = await readIndexedFiles(tier1And2)

    // Step 5 — sample tier 3 files (capped to avoid reading hundreds of test files)
    const tier3 = classifiedFiles
      .filter((f) => f.tier === 3)
      .slice(0, config.maxTier3FilesToSample)
    const { files: sampledFiles, failed: failedSampled } = await readIndexedFiles(tier3, config.tier3MaxLines)

    // Step 6 — compute signals
    const depSignals = computeDependencySignals(classifiedFiles, packageJson)
    const securitySignals = computeSecuritySignals(classifiedFiles, coreFiles)

    return {
      rootPath: absoluteRoot,
      fileTree,
      coreFiles,
      sampledFiles,
      failedReads: [...failedCore, ...failedSampled],
      signals: {
        tests: computeTestSignals(classifiedFiles),
        dependencies: depSignals,
        complexity: computeComplexitySignals(
          classifiedFiles,
          tier1And2.length,
          config.largeFileThreshold
        ),
        security: securitySignals,
        architecture: computeArchitectureSignals(classifiedFiles),
      },
    }
  } catch (err) {
    if (err instanceof FileReadError) throw err
    throw new IndexingError(err)
  }
}