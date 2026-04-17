import type { RawCodebaseData, FileNode } from '@/shared/types'

function flattenTree(nodes: FileNode[], result: string[] = []): string[] {
  for (const node of nodes) {
    result.push(node.relativePath)
    if (node.children) flattenTree(node.children, result)
  }
  return result
}

export function buildParserPrompt(data: RawCodebaseData): string {
  const { signals } = data

  const fileTreeSummary = flattenTree(data.fileTree)
    .slice(0, 50)
    .join('\n')

  const prompt = `
    You are analyzing a software project to produce a structured summary for a team of specialist audit agents.

    You will be given raw facts about the project. Based on these facts, produce a JSON object describing the project shape.

    ## Raw Facts

    ### File Tree (top 50 entries)
    ${fileTreeSummary}

    ### Top Level Folders
    ${signals.architecture.topLevelFolders.join(', ')}

    ### Src Subfolders
    ${signals.architecture.srcSubFolders.join(', ') || 'none detected'}

    ### Max Folder Depth
    ${signals.architecture.maxDepth}

    ### Is Monorepo
    ${signals.architecture.isMonorepo}

    ### Is Flat Structure
    ${signals.architecture.isFlatStructure}

    ### Config Files
    ${signals.architecture.configFiles.join(', ') || 'none'}

    ### Has CI Config
    ${signals.architecture.hasCIConfig}

    ### Has Barrel Exports
    ${signals.architecture.hasBarrelExports}

    ### Dependencies
    Direct: ${JSON.stringify(signals.dependencies.direct)}
    Dev: ${JSON.stringify(signals.dependencies.dev)}

    ### Test Signals
    Has tests: ${signals.tests.hasTests}
    Test framework: ${signals.tests.testFramework ?? 'unknown'}
    Test to source ratio: ${signals.tests.testToSourceRatio}
    Largest untested files: ${signals.tests.largestUntestedFiles.slice(0, 5).join(', ') || 'none'}

    ### Complexity
    Total files: ${signals.complexity.totalFiles}
    Average file size: ${signals.complexity.averageFileSize} lines
    Large files (top 5): ${signals.complexity.largeFiles.slice(0, 5).map((f) => `${f.relativePath} (${f.lineCount} lines)`).join(', ') || 'none'}

    ### Security Signals
    Sensitive path candidates: ${signals.security.sensitivePathCandidates.slice(0, 10).join(', ') || 'none'}
    Has .env file: ${signals.security.hasDotEnv}
    Has .env.example: ${signals.security.hasEnvExample}

    ## Instructions

    Based on the facts above, return ONLY a valid JSON object with this exact shape:

    {
    "framework": "string — detected framework or runtime (e.g. Express.js, Next.js, NestJS, unknown)",
    "architecturePattern": "string — describe the architecture pattern you infer (e.g. feature-based modules, layered monolith, flat structure)",
    "packageManager": "npm | yarn | pnpm | bun | unknown",
    "language": "typescript | javascript | mixed",
    "entryPoints": ["array of likely entry point file paths"],
    "unusualPatterns": ["array of notable patterns worth flagging, or empty array"],
    "specialistGuidance": {
        "security": "only include if you spotted something specific the security agent should focus on",
        "techDebt": "only include if you spotted something specific",
        "architecture": "only include if you spotted something specific",
        "dependency": "only include if you spotted something specific"
    }
    }

    Rules:
    - Return ONLY the JSON object. No explanation, no markdown, no backticks.
    - For specialistGuidance, only include an agent key if you have something genuinely specific to say. Omit keys where you have nothing meaningful to add.
    - Do not invent information not supported by the facts provided.
    - If you cannot determine a value, use "unknown".
    `.trim()

  return prompt
}