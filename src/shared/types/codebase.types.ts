import type { AgentRole } from "./agent.types"

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
  hasTests: boolean
  hasCIConfig: boolean
  entryPoints: string[]
  unusualPatterns: string[]
  specialistGuidance: Partial<Record<AgentRole, string>>
}

export interface CodebaseIndex {
  rootPath: string
  shape: ProjectShape
  fileTree: FileNode[]
  coreFiles: IndexedFile[]                 
  sampledFiles: IndexedFile[]          
  dependencies: {
    direct: Record<string, string>
    dev: Record<string, string>
    lockfilePresent: boolean
  }
  totalFiles: number
  sampledFilesCount: number
}

export interface FileNode {
  name: string
  relativePath: string
  type: 'file' | 'directory'
  sizeBytes?: number
  lineCount?: number
  children?: FileNode[]
}
