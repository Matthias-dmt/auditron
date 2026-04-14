import type { AgentRole } from './agent.types'

export interface FileNode {
  name: string
  relativePath: string
  type: 'file' | 'directory'
  sizeBytes?: number
  lineCount?: number
  children?: FileNode[]
}

export interface IndexedFile {
  path: string
  relativePath: string
  language: string
  content: string
  sizeBytes: number
  lineCount: number
  estimatedTokens: number
}

export interface ProjectShape {
  framework: string
  architecturePattern: string
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown'
  language: 'typescript' | 'javascript' | 'mixed'
  entryPoints: string[]
  unusualPatterns: string[]
  specialistGuidance: Partial<Record<AgentRole, string>>
}

export interface TestSignals {
  hasTests: boolean
  testFiles: string[]
  sourceFiles: string[]
  testToSourceRatio: number
  largestUntestedFiles: string[]
  testFramework: string | null
}

export interface DependencySignals {
  direct: Record<string, string>
  dev: Record<string, string>
  lockfilePresent: boolean
  totalDependencies: number
}

export interface ComplexitySignals {
  largeFiles: Array<{
    relativePath: string
    lineCount: number
  }>
  averageFileSize: number
  totalFiles: number
  sampledFilesCount: number
}

export interface SecuritySignals {
  sensitivePathCandidates: string[]
  hasEnvExample: boolean
  hasDotEnv: boolean
}

export interface ArchitectureSignals {
  topLevelFolders: string[]
  srcSubFolders: string[]
  maxDepth: number
  hasBarrelExports: boolean
  hasCIConfig: boolean
  configFiles: string[]
  isMonorepo: boolean
  isFlatStructure: boolean
}


export interface RawCodebaseData {
  rootPath: string
  fileTree: FileNode[]
  coreFiles: IndexedFile[]
  sampledFiles: IndexedFile[]
  failedReads: string[]  // absolute paths of files that could not be read
  signals: {
    tests: TestSignals
    dependencies: DependencySignals
    complexity: ComplexitySignals
    security: SecuritySignals
    architecture: ArchitectureSignals
  }
}

export interface CodebaseIndex extends RawCodebaseData {
  shape: ProjectShape
}