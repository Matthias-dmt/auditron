import { AuditronError } from "@/shared/errors"

async function main(): Promise<void> {
  console.log('Auditron starting...')
}

main().catch((err) => {
  if (err instanceof AuditronError) {
    console.error(`[${err.name}] ${err.message}`)
  } else {
    console.error('Unexpected error', err)
  }
  process.exit(1)
})
