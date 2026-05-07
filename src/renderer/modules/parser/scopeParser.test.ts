import { describe, it, expect } from 'vitest'
import { parseScope } from './scopeParser'

describe('scopeParser', () => {
  it('parses a basic component with MOD and FIX', () => {
    const raw = `
* ComponentA v3.3.14
   * MOD - Added new feature [PROJ-1001](https://example.com/PROJ-1001) Done
   * FIX - Fixed crash [PROJ-1002] In Review
`
    const { changes, unparsedLines } = parseScope(raw)
    expect(changes).toHaveLength(2)
    expect(changes[0]).toMatchObject({
      nr: 1,
      component: 'ComponentA',
      version: 'v3.3.14',
      type: 'MOD',
      ticket: 'PROJ-1001',
      status: 'Done'
    })
    expect(changes[1]).toMatchObject({
      type: 'FIX',
      ticket: 'PROJ-1002',
      status: 'In Review'
    })
    expect(unparsedLines).toHaveLength(0)
  })

  it('normalizes v. prefix in version', () => {
    const raw = `* ComponentB v.2.6.1\n   * FIX - Something [PROJ-2001] Done`
    const { changes } = parseScope(raw)
    expect(changes[0].version).toBe('v2.6.1')
  })

  it('ignores (from iteration ...) suffix', () => {
    const raw = `* ComponentC v1.0.0 (from iteration R_01.00.40.00)\n   * MOD - Change Done`
    const { changes } = parseScope(raw)
    expect(changes[0].component).toBe('ComponentC')
  })

  it('handles missing ticket', () => {
    const raw = `* ComponentD v1.0.0\n   * FIX - Fix without ticket Done`
    const { changes } = parseScope(raw)
    expect(changes[0].ticket).toBe('')
  })

  it('handles missing status', () => {
    const raw = `* ComponentE v1.0.0\n   * MOD - No status [PROJ-9999]`
    const { changes } = parseScope(raw)
    expect(changes[0].status).toBe('')
  })
})
