import 'dotenv/config'
import { AuditronError } from "@/shared/errors"
import { scanCodebase } from '@/infrastructure/filesystem/scanner'
import { runParser } from '@/pipeline/parser/parser'
import { OllamaAdapter } from '@/infrastructure/llm/ollama'
import { config } from '@/infrastructure/config'

async function main(): Promise<void> {
  const targetRepo = process.argv[2]

  if (!targetRepo) {
    console.error('Usage: pnpm dev <path-to-repo>')
    process.exit(1)
  }

  console.log('Scanning codebase...')
  const raw = await scanCodebase(targetRepo)
  console.log(`Found ${raw.signals.complexity.totalFiles} files`)

  console.log('Running parser agent...')
  const llm = new OllamaAdapter(
    config.ollama.baseUrl,
    config.ollama.defaultModel
  )
  const index = await runParser(raw, llm)

  console.log('\n--- Project Shape ---')
  console.log(JSON.stringify(index.shape, null, 2))
}

main().catch((err) => {
  if (err instanceof AuditronError) {
    console.error(`[${err.name}] ${err.message}`)
  } else {
    console.error('Unexpected error', err)
  }
  process.exit(1)
})
