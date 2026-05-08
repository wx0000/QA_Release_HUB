import type { ParsedChange, ChangeType, ChangeStatus } from '../../types/report.types'

const COMPONENT_RE = /^\*?\s*(.+?) (v\.?[\d.]+)/
const CHANGE_RE = /^\s+\* (MOD|FIX) - (.+)/
const TICKET_MARKDOWN_RE = /\[([A-Z]+-\d+)\]\(https?:\/\/[^)]+\)/
const TICKET_PLAIN_RE = /\[([A-Z]+-\d+)\]/
const TICKET_BARE_RE = /\b([A-Z]+-\d+)\b/
const STATUS_TOKENS: ChangeStatus[] = [
  'Done',
  'In Review',
  'In Progress',
  'Waiting for test',
  'Documentation'
]
const IGNORED_SUFFIX_RE = /\((from iteration|z iteracji)\s+[^)]+\)/i

export interface ScopeParseResult {
  changes: ParsedChange[]
  unparsedLines: string[]
}

export function parseScope(raw: string): ScopeParseResult {
  const lines = raw.split('\n')
  const changes: ParsedChange[] = []
  const unparsedLines: string[] = []

  let currentComponent = ''
  let currentVersion = ''
  let nr = 1

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const compMatch = line.match(COMPONENT_RE)
    if (compMatch) {
      currentComponent = compMatch[1].replace(IGNORED_SUFFIX_RE, '').trim()
      currentVersion = compMatch[2].replace(/^v\./, 'v')
      continue
    }

    const changeMatch = line.match(CHANGE_RE)
    if (changeMatch) {
      if (!currentComponent) {
        unparsedLines.push(trimmed)
        continue
      }

      const type = changeMatch[1] as ChangeType
      let rest = changeMatch[2]

      let ticket = ''
      const mdTicket = rest.match(TICKET_MARKDOWN_RE)
      if (mdTicket) {
        ticket = mdTicket[1]
        rest = rest.replace(mdTicket[0], '').trim()
      } else {
        const bracketTicket = rest.match(TICKET_PLAIN_RE)
        if (bracketTicket) {
          ticket = bracketTicket[1]
          rest = rest.replace(bracketTicket[0], '').trim()
        } else {
          const bareTicket = rest.match(TICKET_BARE_RE)
          if (bareTicket) {
            ticket = bareTicket[1]
            rest = rest.replace(bareTicket[0], '').trim()
          }
        }
      }

      let status: ChangeStatus = ''
      for (const s of STATUS_TOKENS) {
        if (rest.endsWith(s)) {
          status = s
          rest = rest.slice(0, -s.length).trim()
          break
        }
      }

      changes.push({
        nr: nr++,
        component: currentComponent,
        version: currentVersion,
        type,
        changeDescription: rest,
        ticket,
        status
      })
      continue
    }

    // All other lines silently skipped
  }

  return { changes, unparsedLines }
}
