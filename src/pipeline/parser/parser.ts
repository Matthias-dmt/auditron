import type { RawCodebaseData, CodebaseIndex, ProjectShape } from '@/shared/types'
import type { LLMAdapter } from '@/infrastructure/llm/adapter'
import { buildParserPrompt } from './parser.prompt'
import { LLMResponseParseError } from '@/shared/errors'

function isProjectShape(value: unknown): value is ProjectShape {
  if (typeof value !== 'object' || value === null) return false

  const v = value as Record<string, unknown>

  return (
    typeof v.framework === 'string' &&
    typeof v.architecturePattern === 'string' &&
    typeof v.packageManager === 'string' &&
    typeof v.language === 'string' &&
    Array.isArray(v.entryPoints) &&
    Array.isArray(v.unusualPatterns) &&
    typeof v.specialistGuidance === 'object' &&
    v.specialistGuidance !== null
  )
}

function parseProjectShape(raw: string): ProjectShape {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new LLMResponseParseError(err)
  }

  if (!isProjectShape(parsed)) {
    throw new LLMResponseParseError('LLM response does not match ProjectShape')
  }

  return parsed
}

export async function runParser(
  data: RawCodebaseData,
  llm: LLMAdapter
): Promise<CodebaseIndex> {
  const prompt = buildParserPrompt(data)

  const raw = await llm.complete(prompt, {
    temperature: 0.1,
    maxTokens: 1000,
  })

  const shape = parseProjectShape(raw)

  return {
    ...data,
    shape,
  }
}