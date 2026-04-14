import { ConfigError } from '@/shared/errors'

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new ConfigError(`Missing required environment variable: ${key}`)
  return value
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue
}

export const config = {
  ollama: {
    baseUrl: optionalEnv('OLLAMA_BASE_URL', 'http://localhost:11434'),
    defaultModel: optionalEnv('OLLAMA_MODEL', 'llama3'),
  },
  audit: {
    maxFilesToSample: parseInt(optionalEnv('MAX_FILES_TO_SAMPLE', '50')),
    maxTokensPerChunk: parseInt(optionalEnv('MAX_TOKENS_PER_CHUNK', '6000')),
    outputDir: optionalEnv('OUTPUT_DIR', './output'),
  },
} as const