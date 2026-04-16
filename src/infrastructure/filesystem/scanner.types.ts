// ─── File Tiers ───────────────────────────────────────────────────────────────
//
// Tier 1 — always read fully: package.json, tsconfig, entry points, README
// Tier 2 — read fully, flag if large: source files, config files
// Tier 3 — sample only (first N lines): test files, large utility files
// Tier 4 — metadata only, no content: everything else that passed exclusions

export type FileTier = 1 | 2 | 3 | 4

// ─── Classified File ──────────────────────────────────────────────────────────

export interface ClassifiedFile {
  absolutePath: string
  relativePath: string
  name: string
  sizeBytes: number
  lineCount: number
  tier: FileTier
}

// ─── Scanner Config ───────────────────────────────────────────────────────────

export interface ScannerConfig {
  maxFilesToSample: number       // max tier 1+2 files to read fully
  maxTier3FilesToSample: number  // max tier 3 files to read (sampled)
  tier3MaxLines: number          // max lines to sample for tier 3 files
  largeFileThreshold: number     // line count above which a file is flagged as large
}

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  maxFilesToSample: 50,
  maxTier3FilesToSample: 30,
  tier3MaxLines: 100,
  largeFileThreshold: 300,
}

// ─── Exclusion Patterns ───────────────────────────────────────────────────────

export const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'out',
  'coverage',
  '.git',
  '.turbo',
  '.cache',
])

export const EXCLUDED_EXTENSIONS = new Set([
  '.map',
  '.min.js',
  '.lock',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
])

export const EXCLUDED_FILES = new Set([
  '.env',
  '.DS_Store',
])

// ─── Tier 1 Patterns ─────────────────────────────────────────────────────────

export const TIER1_FILENAMES = new Set([
  'package.json',
  'tsconfig.json',
  'tsconfig.base.json',
  'README.md',
  '.env.example',
  'index.ts',
  'index.js',
  'main.ts',
  'main.js',
  'app.ts',
  'app.js',
  'server.ts',
  'server.js',
])

// ─── Tier 2 Patterns ─────────────────────────────────────────────────────────

export const TIER2_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
])

export const TIER2_KEYWORDS = [
  'auth',
  'security',
  'middleware',
  'config',
  'database',
  'db',
  'sql',
  'jwt',
  'password',
  'secret',
]

// ─── Tier 3 Patterns ─────────────────────────────────────────────────────────

export const TIER3_PATTERNS = [
  /\.test\.(ts|js|tsx|jsx)$/,
  /\.spec\.(ts|js|tsx|jsx)$/,
  /\.stories\.(ts|js|tsx|jsx)$/,
]

// ─── Tier 4 Patterns ─────────────────────────────────────────────────────────

export const TIER4_FILENAMES = new Set([
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  'bun.lockb',
])