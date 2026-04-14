import type { ClassifiedFile } from '../scanner.types'
import type { DependencySignals } from '@/shared/types'

const LOCKFILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
])

export function computeDependencySignals(
  files: ClassifiedFile[],
  packageJson: Record<string, unknown> | null
): DependencySignals {
  const lockfilePresent = files.some((f) => LOCKFILES.has(f.name))

  if (!packageJson) {
    return {
      direct: {},
      dev: {},
      lockfilePresent,
      totalDependencies: 0,
    }
  }

  const direct = (packageJson.dependencies ?? {}) as Record<string, string>
  const dev = (packageJson.devDependencies ?? {}) as Record<string, string>

  return {
    direct,
    dev,
    lockfilePresent,
    totalDependencies: Object.keys(direct).length + Object.keys(dev).length,
  }
}