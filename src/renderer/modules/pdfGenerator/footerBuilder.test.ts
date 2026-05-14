import { describe, test, expect } from 'vitest'
import { buildFooter } from './footerBuilder'
import { TOC_ANCHOR, LABELS } from './constants'

interface ColumnsContentLike {
  columns: Array<{ text?: string; linkToDestination?: string }>
}

function rightCol(footer: ReturnType<ReturnType<typeof buildFooter>['footer']>): {
  text?: string
  link?: string
} {
  const cols = (footer as unknown as ColumnsContentLike).columns
  return { text: cols[1].text, link: cols[1].linkToDestination }
}

function leftText(footer: ReturnType<ReturnType<typeof buildFooter>['footer']>): string {
  return (footer as unknown as ColumnsContentLike).columns[0].text ?? ''
}

describe('buildFooter — back-link visibility (Option A: simple page-range)', () => {
  test('first page (Section 1) → no back-link', () => {
    const f = buildFooter('R_01.00.05.00')
    const r = rightCol(f.footer(1, 15))
    expect(r.text).toBe('')
    expect(r.link).toBeUndefined()
  })

  test('last page (Section 3) → no back-link', () => {
    const f = buildFooter('R_01.00.05.00')
    const r = rightCol(f.footer(15, 15))
    expect(r.text).toBe('')
    expect(r.link).toBeUndefined()
  })

  test('middle page (Section 2) → back-link present', () => {
    const f = buildFooter('R_01.00.05.00')
    const r = rightCol(f.footer(7, 15))
    expect(r.text).toBe(LABELS.FOOTER_BACK_TO_TOC)
    expect(r.link).toBe(TOC_ANCHOR)
  })

  test('every page in 2..pageCount-1 shows back-link', () => {
    const f = buildFooter('R_01.00.05.00')
    for (let p = 2; p <= 14; p += 1) {
      expect(rightCol(f.footer(p, 15)).text).toBe(LABELS.FOOTER_BACK_TO_TOC)
    }
  })

  test('two-page document → no back-link on either page', () => {
    const f = buildFooter('R_01.00.05.00')
    expect(rightCol(f.footer(1, 2)).text).toBe('')
    expect(rightCol(f.footer(2, 2)).text).toBe('')
  })

  test('single-page document → no back-link', () => {
    const f = buildFooter('R_01.00.05.00')
    expect(rightCol(f.footer(1, 1)).text).toBe('')
  })

  test('three-page document → back-link only on middle page', () => {
    const f = buildFooter('R_01.00.05.00')
    expect(rightCol(f.footer(1, 3)).text).toBe('')
    expect(rightCol(f.footer(2, 3)).text).toBe(LABELS.FOOTER_BACK_TO_TOC)
    expect(rightCol(f.footer(3, 3)).text).toBe('')
  })
})

describe('buildFooter — left side', () => {
  test('contains app name, deployment, page X/Y', () => {
    const f = buildFooter('R_01.00.05.00')
    const text = leftText(f.footer(2, 7))
    expect(text).toContain(LABELS.FOOTER_APP)
    expect(text).toContain('R_01.00.05.00')
    expect(text).toContain('2 / 7')
  })
})
