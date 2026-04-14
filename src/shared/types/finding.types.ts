export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Finding {
  id: string
  severity: Severity
  title: string
  description: string
  file?: string
  line?: number
  recommendation: string
}
