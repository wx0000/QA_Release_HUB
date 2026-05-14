import { describe, test, expect } from 'vitest'
import { buildComponentBlock, hasVisibleContent } from './blockBuilder'
import type { ImageSizeMap } from './tiptapToPdfContent'
import type { ParsedChange } from '../../types/report.types'
import {
  componentBlockAnchor,
  LABELS,
  MOD_BADGE_BG,
  FIX_BADGE_BG,
  POSITIVE_COLOR
} from './constants'

const emptySizes: ImageSizeMap = new Map()

function makeChange(overrides: Partial<ParsedChange> = {}): ParsedChange {
  return {
    nr: 1,
    component: 'ComponentA',
    version: 'v1.0.0',
    type: 'MOD',
    changeDescription: 'Sample change description',
    ticket: 'PROJ-1234',
    status: 'Done',
    ...overrides
  }
}

// Structure (see blockBuilder.ts):
//   blocks[0] = anchor:      { id, pageBreak: 'before', text: ' ', fontSize: 1 }
//   blocks[1] = headerTable: { unbreakable: true, table: {...} }
//   blocks[2+] = TipTap content OR placeholder if content empty

interface AnchorLike {
  id: string
  pageBreak: string
  text: string
}

interface HeaderTableLike {
  unbreakable: boolean
  table: { body: Array<Array<{ fillColor: string; stack: unknown[] }>> }
}

interface BadgeCellLike {
  text: string
  fillColor: string
}

describe('buildComponentBlock — structure', () => {
  test('returns anchor + headerTable + content (3+ nodes for non-empty)', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'some' }] }]
    })
    const blocks = buildComponentBlock(makeChange(), json, emptySizes)
    expect(blocks.length).toBeGreaterThanOrEqual(3)
  })

  test('anchor (blocks[0]) carries correct id', () => {
    const blocks = buildComponentBlock(makeChange({ nr: 7 }), '', emptySizes)
    const anchor = blocks[0] as unknown as AnchorLike
    expect(anchor.id).toBe(componentBlockAnchor(7))
  })

  test('anchor (blocks[0]) has pageBreak: before', () => {
    const blocks = buildComponentBlock(makeChange(), '', emptySizes)
    const anchor = blocks[0] as unknown as AnchorLike
    expect(anchor.pageBreak).toBe('before')
  })

  test('anchor (blocks[0]) is a tiny text node (not a table)', () => {
    const blocks = buildComponentBlock(makeChange(), '', emptySizes)
    const anchor = blocks[0] as unknown as AnchorLike & { table?: unknown }
    expect(typeof anchor.text).toBe('string')
    expect(anchor.table).toBeUndefined()
  })

  test('headerTable (blocks[1]) is unbreakable', () => {
    const blocks = buildComponentBlock(makeChange(), '', emptySizes)
    const headerTable = blocks[1] as unknown as HeaderTableLike
    expect(headerTable.unbreakable).toBe(true)
    expect(headerTable.table.body).toBeDefined()
  })

  test('headerTable (blocks[1]) has no id and no pageBreak (anchor moved out)', () => {
    const blocks = buildComponentBlock(makeChange(), '', emptySizes)
    const headerTable = blocks[1] as unknown as HeaderTableLike & {
      id?: string
      pageBreak?: string
    }
    expect(headerTable.id).toBeUndefined()
    expect(headerTable.pageBreak).toBeUndefined()
  })
})

describe('buildComponentBlock — type badge in bottom row', () => {
  // After R2-P5: badge moved from top row column 1 to bottom row column 0.
  function findBadgeCell(blocks: unknown[]): BadgeCellLike | undefined {
    const headerTable = blocks[1] as unknown as HeaderTableLike
    const cellStack = headerTable.table.body[0][0].stack
    const bottomRow = cellStack[1] as { columns: Array<{ stack?: unknown[] }> }
    const badgeCol = bottomRow.columns[0]
    if (!badgeCol.stack) return undefined
    const badgeTable = badgeCol.stack[0] as { table: { body: BadgeCellLike[][] } }
    return badgeTable.table.body[0][0]
  }

  test('MOD → blue badge in bottom row', () => {
    const blocks = buildComponentBlock(makeChange({ type: 'MOD' }), '', emptySizes)
    const badge = findBadgeCell(blocks)
    expect(badge?.text).toBe('MOD')
    expect(badge?.fillColor).toBe(MOD_BADGE_BG)
  })

  test('FIX → amber badge in bottom row', () => {
    const blocks = buildComponentBlock(makeChange({ type: 'FIX' }), '', emptySizes)
    const badge = findBadgeCell(blocks)
    expect(badge?.text).toBe('FIX')
    expect(badge?.fillColor).toBe(FIX_BADGE_BG)
  })
})

describe('buildComponentBlock — bottom row description format', () => {
  test('bottom row shows " : <description>" after badge', () => {
    const change = makeChange({ changeDescription: 'Refactor X' })
    const blocks = buildComponentBlock(change, '', emptySizes)
    const headerTable = blocks[1] as unknown as HeaderTableLike
    const bottomRow = headerTable.table.body[0][0].stack[1] as {
      columns: Array<{ text?: string }>
    }
    const descCol = bottomRow.columns[1]
    expect(descCol.text).toBe(' : Refactor X')
  })
})

describe('buildComponentBlock — top row layout', () => {
  test('top row: title left, ticket and POSITIVE right (no badge in top)', () => {
    const blocks = buildComponentBlock(makeChange(), '', emptySizes)
    const headerTable = blocks[1] as unknown as HeaderTableLike
    const topRow = headerTable.table.body[0][0].stack[0] as {
      columns: Array<{ text?: string | Array<{ text: string }>; color?: string }>
    }
    // [titleText, spacer, ticket, positive]
    expect(topRow.columns).toHaveLength(4)
    expect(topRow.columns[0].text).toContain('ComponentA')
    expect(topRow.columns[0].text).toContain('v1.0.0')
    const ticketRun = topRow.columns[2].text as Array<{ text: string }>
    expect(ticketRun[1].text).toBe('PROJ-1234')
    expect(topRow.columns[3].text).toContain(LABELS.RESULT_POSITIVE)
    expect(topRow.columns[3].color).toBe(POSITIVE_COLOR)
  })
})

describe('buildComponentBlock — empty content placeholder', () => {
  test('empty string currentResult → placeholder rendered', () => {
    const blocks = buildComponentBlock(makeChange(), '', emptySizes)
    expect(blocks.length).toBe(3)
    const placeholder = blocks[2] as { text: string; italics: boolean }
    expect(placeholder.text).toBe(LABELS.BLOCK_NO_TEST_CONTENT)
    expect(placeholder.italics).toBe(true)
  })

  test('empty paragraph TipTap → placeholder rendered', () => {
    const json = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })
    const blocks = buildComponentBlock(makeChange(), json, emptySizes)
    const placeholder = blocks[2] as { text: string }
    expect(placeholder.text).toBe(LABELS.BLOCK_NO_TEST_CONTENT)
  })

  test('whitespace-only TipTap text → placeholder rendered', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '   ' }] }]
    })
    const blocks = buildComponentBlock(makeChange(), json, emptySizes)
    const placeholder = blocks[2] as { text: string }
    expect(placeholder.text).toBe(LABELS.BLOCK_NO_TEST_CONTENT)
  })

  test('TipTap with real text → no placeholder, content rendered', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'real content' }] }]
    })
    const blocks = buildComponentBlock(makeChange(), json, emptySizes)
    expect(blocks.length).toBe(3)
    const para = blocks[2] as { text: unknown }
    expect(para.text).not.toBe(LABELS.BLOCK_NO_TEST_CONTENT)
  })
})

describe('hasVisibleContent', () => {
  test('empty string → false', () => {
    expect(hasVisibleContent('')).toBe(false)
  })

  test('malformed JSON → false', () => {
    expect(hasVisibleContent('{bad json')).toBe(false)
  })

  test('empty content array → false', () => {
    expect(hasVisibleContent(JSON.stringify({ type: 'doc', content: [] }))).toBe(false)
  })

  test('empty paragraph → false', () => {
    expect(hasVisibleContent(JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph' }]
    }))).toBe(false)
  })

  test('whitespace-only text → false', () => {
    expect(hasVisibleContent(JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '   \n\t' }] }]
    }))).toBe(false)
  })

  test('non-whitespace text → true', () => {
    expect(hasVisibleContent(JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }]
    }))).toBe(true)
  })

  test('image present → true', () => {
    expect(hasVisibleContent(JSON.stringify({
      type: 'doc',
      content: [{ type: 'image', attrs: { src: 'data:image/png;base64,X' } }]
    }))).toBe(true)
  })

  test('horizontalRule present → true', () => {
    expect(hasVisibleContent(JSON.stringify({
      type: 'doc',
      content: [{ type: 'horizontalRule' }]
    }))).toBe(true)
  })

  test('nested visible content (listItem → paragraph → text) → true', () => {
    expect(hasVisibleContent(JSON.stringify({
      type: 'doc',
      content: [{
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }]
        }]
      }]
    }))).toBe(true)
  })
})

describe('buildComponentBlock — sanity check on test fixtures', () => {
  const srcA = 'data:image/png;base64,A'
  const srcB = 'data:image/png;base64,B'
  const sizes: ImageSizeMap = new Map([
    [srcA, { widthPt: 100, heightPt: 80 }],
    [srcB, { widthPt: 1000, heightPt: 400 }]
  ])

  test('no images, empty text → header + placeholder', () => {
    const blocks = buildComponentBlock(makeChange(), '', emptySizes)
    expect(() => blocks).not.toThrow()
    // anchor + headerTable + placeholder = 3
    expect(blocks.length).toBe(3)
  })

  test('no images, long text → header + 1 paragraph', () => {
    const longText = 'word '.repeat(200)
    const json = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: longText }] }]
    })
    const blocks = buildComponentBlock(makeChange(), json, emptySizes)
    // anchor + headerTable + 1 paragraph = 3
    expect(blocks.length).toBe(3)
  })

  test('1 image', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [{ type: 'image', attrs: { src: srcA } }]
    })
    const blocks = buildComponentBlock(makeChange(), json, sizes)
    // anchor + headerTable + 1 image = 3
    expect(blocks.length).toBe(3)
  })

  test('5 images mixed with prose', () => {
    const json = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Intro' }] },
        { type: 'image', attrs: { src: srcA } },
        { type: 'image', attrs: { src: srcB } },
        { type: 'paragraph', content: [{ type: 'text', text: 'Middle' }] },
        { type: 'image', attrs: { src: srcA } },
        { type: 'image', attrs: { src: srcB } },
        { type: 'image', attrs: { src: srcA } }
      ]
    })
    const blocks = buildComponentBlock(makeChange(), json, sizes)
    // anchor + headerTable + 2 paragraphs + 5 images = 9
    expect(blocks.length).toBe(9)
  })

  test('multiple changes do not collide on anchors', () => {
    const blocksA = buildComponentBlock(makeChange({ nr: 1 }), '', emptySizes)
    const blocksB = buildComponentBlock(makeChange({ nr: 2 }), '', emptySizes)
    const idA = (blocksA[0] as unknown as AnchorLike).id
    const idB = (blocksB[0] as unknown as AnchorLike).id
    expect(idA).not.toBe(idB)
  })
})
