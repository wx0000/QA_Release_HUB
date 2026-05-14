import { describe, test, expect } from 'vitest'
import { buildSection2TOC } from './tocBuilder'
import type { ParsedChange } from '../../types/report.types'
import {
  componentBlockAnchor,
  LABELS,
  POSITIVE_COLOR
} from './constants'

function makeChange(overrides: Partial<ParsedChange> = {}): ParsedChange {
  return {
    nr: 1,
    component: 'ComponentA',
    version: 'v1.0.0',
    type: 'MOD',
    changeDescription: 'desc',
    ticket: 'PROJ-1234',
    status: 'Done',
    ...overrides
  }
}

interface CellLike {
  text?: string | number
  pageReference?: string
  linkToDestination?: string
  color?: string
  bold?: boolean
}

interface TableContentLike {
  table: { headerRows: number; widths: unknown[]; body: CellLike[][] }
}

describe('buildSection2TOC', () => {
  test('empty changes → empty array (TOC_ANCHOR lives on Section 2 title)', () => {
    expect(buildSection2TOC([])).toEqual([])
  })

  test('non-empty changes → single table content node', () => {
    const result = buildSection2TOC([makeChange(), makeChange({ nr: 2 })])
    expect(result).toHaveLength(1)
  })

  test('table has header row + N data rows', () => {
    const changes = [makeChange({ nr: 1 }), makeChange({ nr: 2 }), makeChange({ nr: 3 })]
    const table = (buildSection2TOC(changes)[0] as unknown as TableContentLike).table
    expect(table.headerRows).toBe(1)
    expect(table.body).toHaveLength(4)
  })

  test('header row contains all 5 column labels', () => {
    const result = buildSection2TOC([makeChange()])
    const headerCells = (result[0] as unknown as TableContentLike).table.body[0]
    const labels = headerCells.map(c => c.text)
    expect(labels).toEqual([
      LABELS.TOC_COL_NR,
      LABELS.TOC_COL_COMPONENT,
      LABELS.TOC_COL_VERSION,
      LABELS.TOC_COL_RESULT,
      LABELS.TOC_COL_PAGE
    ])
  })

  test('first 4 cells (Nr, Component, Version, Result) have linkToDestination', () => {
    const result = buildSection2TOC([makeChange({ nr: 5 })])
    const dataRow = (result[0] as unknown as TableContentLike).table.body[1]
    const expectedAnchor = componentBlockAnchor(5)
    expect(dataRow[0].linkToDestination).toBe(expectedAnchor)
    expect(dataRow[1].linkToDestination).toBe(expectedAnchor)
    expect(dataRow[2].linkToDestination).toBe(expectedAnchor)
    expect(dataRow[3].linkToDestination).toBe(expectedAnchor)
  })

  test('pageReference cell has NO linkToDestination (conflict avoidance)', () => {
    // pdfmake auto-hyperlinks pageReference text to its anchor.
    // Adding linkToDestination on the same cell conflicts → both links break.
    const result = buildSection2TOC([makeChange({ nr: 5 })])
    const dataRow = (result[0] as unknown as TableContentLike).table.body[1]
    const pageCell = dataRow[4]
    expect(pageCell.pageReference).toBe(componentBlockAnchor(5))
    expect(pageCell.linkToDestination).toBeUndefined()
  })

  test('result cell rendered in green with bold POSITIVE label', () => {
    const result = buildSection2TOC([makeChange()])
    const dataRow = (result[0] as unknown as TableContentLike).table.body[1]
    const resultCell = dataRow[3]
    expect(resultCell.text).toBe(LABELS.RESULT_POSITIVE)
    expect(resultCell.color).toBe(POSITIVE_COLOR)
    expect(resultCell.bold).toBe(true)
  })

  test('component + version cells reflect change data', () => {
    const change = makeChange({ nr: 12, component: 'ComponentB', version: 'v2.3.4' })
    const dataRow = (buildSection2TOC([change])[0] as unknown as TableContentLike).table.body[1]
    expect(dataRow[0].text).toBe('12')
    expect(dataRow[1].text).toBe('ComponentB')
    expect(dataRow[2].text).toBe('v2.3.4')
  })
})
