import { describe, test, expect } from 'vitest'
import { parseScope } from './scopeParser'

const COMPONENT = '* ComponentA v1.0.0\n'
const wrap = (line: string) => COMPONENT + `   * ${line}`

// ---------------------------------------------------------------------------
// Ticket extraction
// ---------------------------------------------------------------------------
describe('scopeParser — ticket extraction', () => {
  const cases = [
    {
      desc: 'markdown link ticket',
      input: wrap('MOD - Fix cache [PROJ-1234](https://example.com/PROJ-1234) Done'),
      ticket: 'PROJ-1234',
      desc_text: 'Fix cache'
    },
    {
      desc: 'bracketed ticket no URL',
      input: wrap('MOD - Fix cache [PROJ-1234] Done'),
      ticket: 'PROJ-1234',
      desc_text: 'Fix cache'
    },
    {
      desc: 'bare ticket at end of description',
      input: wrap('MOD - Fix cache PROJ-1234 Done'),
      ticket: 'PROJ-1234',
      desc_text: 'Fix cache'
    },
    {
      desc: 'bare ticket with no status',
      input: wrap('FIX - Null pointer PROJ-5678'),
      ticket: 'PROJ-5678',
      desc_text: 'Null pointer'
    },
    {
      desc: 'no ticket',
      input: wrap('MOD - Refactor internals Done'),
      ticket: '',
      desc_text: 'Refactor internals'
    }
  ]

  test.each(cases)('$desc', ({ input, ticket, desc_text }) => {
    const { changes } = parseScope(input)
    expect(changes).toHaveLength(1)
    expect(changes[0].ticket).toBe(ticket)
    expect(changes[0].changeDescription).toBe(desc_text)
  })
})

// ---------------------------------------------------------------------------
// Status recognition
// ---------------------------------------------------------------------------
describe('scopeParser — status recognition', () => {
  const cases = [
    { desc: 'Done', status: 'Done' },
    { desc: 'In Review', status: 'In Review' },
    { desc: 'In Progress', status: 'In Progress' },
    { desc: 'Waiting for test', status: 'Waiting for test' },
    { desc: 'Documentation', status: 'Documentation' },
    { desc: 'no status → empty string', status: '' }
  ]

  test.each(cases)('$desc', ({ status }) => {
    const line = status
      ? `MOD - Description [PROJ-1234] ${status}`
      : 'MOD - Description [PROJ-1234]'
    const { changes } = parseScope(COMPONENT + `   * ${line}`)
    expect(changes[0].status).toBe(status)
  })
})

// ---------------------------------------------------------------------------
// Version normalization
// ---------------------------------------------------------------------------
describe('scopeParser — component line format', () => {
  const cases = [
    { desc: 'with bullet: * ComponentA v1.0.0', line: '* ComponentA v1.0.0' },
    { desc: 'no bullet: ComponentA v1.0.0', line: 'ComponentA v1.0.0' },
    { desc: 'no bullet with build suffix: ComponentA v1.0.0 (build: 20260414081619989)', line: 'ComponentA v1.0.0 (build: 20260414081619989)' }
  ]

  test.each(cases)('$desc', ({ line }) => {
    const { changes } = parseScope(`${line}\n   * MOD - Desc Done`)
    expect(changes[0].component).toBe('ComponentA')
    expect(changes[0].version).toBe('v1.0.0')
  })
})

describe('scopeParser — version normalization', () => {
  const cases = [
    { desc: 'v. prefix stripped', raw: 'v.2.6.1', expected: 'v2.6.1' },
    { desc: 'v prefix kept', raw: 'v3.3.14', expected: 'v3.3.14' }
  ]

  test.each(cases)('$desc', ({ raw, expected }) => {
    const { changes } = parseScope(`* ComponentA ${raw}\n   * MOD - Desc Done`)
    expect(changes[0].version).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Component suffix stripping
// ---------------------------------------------------------------------------
describe('scopeParser — ignored suffix on component line', () => {
  const cases = [
    {
      desc: 'English: (from iteration R_01.00.40.00)',
      line: '* ComponentA v1.0.0 (from iteration R_01.00.40.00)',
      expected: 'ComponentA'
    },
    {
      desc: 'Polish: (z iteracji R_01.00.40.00)',
      line: '* ComponentA v1.0.0 (z iteracji R_01.00.40.00)',
      expected: 'ComponentA'
    }
  ]

  test.each(cases)('$desc', ({ line, expected }) => {
    const { changes } = parseScope(`${line}\n   * MOD - Desc Done`)
    expect(changes[0].component).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Line skipping and unparsedLines
// ---------------------------------------------------------------------------
describe('scopeParser — line skipping', () => {
  test('non-MOD/FIX lines are silently skipped, not added to unparsedLines', () => {
    const raw = `
* ComponentA v1.0.0
   Some note that is not a change
   * MOD - Real change [PROJ-1234] Done
   Another random line
`
    const { changes, unparsedLines } = parseScope(raw)
    expect(changes).toHaveLength(1)
    expect(unparsedLines).toHaveLength(0)
  })

  test('MOD/FIX line before any component goes to unparsedLines', () => {
    const raw = `   * MOD - Orphan change [PROJ-1234] Done`
    const { changes, unparsedLines } = parseScope(raw)
    expect(changes).toHaveLength(0)
    expect(unparsedLines).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Bulletless change lines
// ---------------------------------------------------------------------------
describe('scopeParser — bulletless change lines', () => {
  const cases = [
    {
      desc: 'bare MOD with bare ticket and Done',
      input: `* ComponentA v1.0.0\nMOD - Fix something BEN-1234 Done`,
      expected: { type: 'MOD', ticket: 'BEN-1234', status: 'Done', changeDescription: 'Fix something' }
    },
    {
      desc: 'bare FIX with bare ticket and In Progress',
      input: `* ComponentA v1.0.0\nFIX - Another thing BEN-5678 In Progress`,
      expected: { type: 'FIX', ticket: 'BEN-5678', status: 'In Progress', changeDescription: 'Another thing' }
    },
    {
      desc: 'bare MOD with no ticket and no status',
      input: `* ComponentA v1.0.0\nMOD - Plain change`,
      expected: { type: 'MOD', ticket: '', status: '', changeDescription: 'Plain change' }
    }
  ]

  test.each(cases)('$desc', ({ input, expected }) => {
    const { changes } = parseScope(input)
    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject(expected)
  })

  test('bulletless MOD before any component goes to unparsedLines', () => {
    const { changes, unparsedLines } = parseScope('MOD - Orphan BEN-1234 Done')
    expect(changes).toHaveLength(0)
    expect(unparsedLines).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Component header without version
// ---------------------------------------------------------------------------
describe('scopeParser — component header without version', () => {
  test('header without version followed by MOD/FIX is recognized with empty version', () => {
    const raw = 'Baza benefit_xcode_runner\n   * MOD - Fix something Done'
    const { changes } = parseScope(raw)
    expect(changes).toHaveLength(1)
    expect(changes[0].component).toBe('Baza benefit_xcode_runner')
    expect(changes[0].version).toBe('')
    expect(changes[0].type).toBe('MOD')
    expect(changes[0].status).toBe('Done')
  })

  test('header without version followed by nothing is NOT treated as a component header', () => {
    const raw = 'Baza benefit_xcode_runner'
    const { changes, unparsedLines } = parseScope(raw)
    expect(changes).toHaveLength(0)
    expect(unparsedLines).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Multi-component input
// ---------------------------------------------------------------------------
describe('scopeParser — multi-component', () => {
  test('assigns correct component and nr across sections', () => {
    const raw = `
* ComponentA v1.0.0
   * MOD - Feature A [PROJ-1234] Done
* ComponentB v2.0.0
   * FIX - Bug B [PROJ-5678] In Review
`
    const { changes } = parseScope(raw)
    expect(changes).toHaveLength(2)
    expect(changes[0]).toMatchObject({ nr: 1, component: 'ComponentA', ticket: 'PROJ-1234' })
    expect(changes[1]).toMatchObject({ nr: 2, component: 'ComponentB', ticket: 'PROJ-5678' })
  })
})
