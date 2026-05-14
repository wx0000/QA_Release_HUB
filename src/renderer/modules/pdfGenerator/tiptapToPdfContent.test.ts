import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { tiptapToPdfContent, type ImageSizeMap } from './tiptapToPdfContent'
import { CODE_BG, HEADING_SIZES, IMAGE_MAX_WIDTH_PT, IMAGE_MAX_HEIGHT_PT } from './constants'

const emptySizes: ImageSizeMap = new Map()

function jsonDoc(content: unknown): string {
  return JSON.stringify({ type: 'doc', content })
}

interface PdfRunLike {
  text: string
  bold?: boolean
  italics?: boolean
  decoration?: 'underline' | 'lineThrough'
  background?: string
}

interface PdfTextBlockLike {
  text: PdfRunLike[] | string
  fontSize?: number
  bold?: boolean
}

interface PdfImageLike {
  image: string
  width?: number
  fit?: [number, number]
}

interface PdfListLike {
  ul?: unknown[]
  ol?: unknown[]
}

interface PdfTableLike {
  table: { body: unknown[][] }
  layout?: string
}

interface PdfCanvasLike {
  canvas: Array<{ type: string }>
}

describe('tiptapToPdfContent — defensive cases', () => {
  test('empty string → []', () => {
    expect(tiptapToPdfContent('', emptySizes)).toEqual([])
  })

  test('malformed JSON → []', () => {
    expect(tiptapToPdfContent('{not-json', emptySizes)).toEqual([])
  })

  test('null content → []', () => {
    expect(tiptapToPdfContent('null', emptySizes)).toEqual([])
  })

  test('doc without content array → []', () => {
    expect(tiptapToPdfContent('{"type":"doc"}', emptySizes)).toEqual([])
  })

  test('empty content array → []', () => {
    expect(tiptapToPdfContent(jsonDoc([]), emptySizes)).toEqual([])
  })
})

describe('tiptapToPdfContent — paragraph + inline marks', () => {
  test('plain text paragraph', () => {
    const json = jsonDoc([
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }
    ])
    const result = tiptapToPdfContent(json, emptySizes)
    expect(result).toHaveLength(1)
    const block = result[0] as PdfTextBlockLike
    expect(Array.isArray(block.text)).toBe(true)
    const runs = block.text as PdfRunLike[]
    expect(runs[0].text).toBe('Hello world')
  })

  test('bold and italic marks', () => {
    const json = jsonDoc([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'b', marks: [{ type: 'bold' }] },
          { type: 'text', text: 'i', marks: [{ type: 'italic' }] }
        ]
      }
    ])
    const runs = (tiptapToPdfContent(json, emptySizes)[0] as PdfTextBlockLike).text as PdfRunLike[]
    expect(runs[0].bold).toBe(true)
    expect(runs[1].italics).toBe(true)
  })

  test('underline + strike decorations', () => {
    const json = jsonDoc([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'u', marks: [{ type: 'underline' }] },
          { type: 'text', text: 's', marks: [{ type: 'strike' }] }
        ]
      }
    ])
    const runs = (tiptapToPdfContent(json, emptySizes)[0] as PdfTextBlockLike).text as PdfRunLike[]
    expect(runs[0].decoration).toBe('underline')
    expect(runs[1].decoration).toBe('lineThrough')
  })

  test('inline code mark → gray background (no monospace; see pdfGenerator note)', () => {
    const json = jsonDoc([
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'snippet', marks: [{ type: 'code' }] }]
      }
    ])
    const runs = (tiptapToPdfContent(json, emptySizes)[0] as PdfTextBlockLike).text as PdfRunLike[]
    expect(runs[0].background).toBe(CODE_BG)
  })

  test('hardBreak → newline run', () => {
    const json = jsonDoc([
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'a' },
          { type: 'hardBreak' },
          { type: 'text', text: 'b' }
        ]
      }
    ])
    const runs = (tiptapToPdfContent(json, emptySizes)[0] as PdfTextBlockLike).text as PdfRunLike[]
    expect(runs).toHaveLength(3)
    expect(runs[1].text).toBe('\n')
  })

  test('empty paragraph dropped', () => {
    const json = jsonDoc([{ type: 'paragraph', content: [] }])
    expect(tiptapToPdfContent(json, emptySizes)).toEqual([])
  })
})

describe('tiptapToPdfContent — heading levels', () => {
  const cases = [1, 2, 3, 4, 5, 6].map(level => ({
    level,
    expectedFontSize: HEADING_SIZES[level - 1]
  }))

  test.each(cases)('H$level uses fontSize $expectedFontSize', ({ level, expectedFontSize }) => {
    const json = jsonDoc([
      {
        type: 'heading',
        attrs: { level },
        content: [{ type: 'text', text: `H${level}` }]
      }
    ])
    const block = tiptapToPdfContent(json, emptySizes)[0] as PdfTextBlockLike
    expect(block.fontSize).toBe(expectedFontSize)
    expect(block.bold).toBe(true)
  })

  test('heading level out of range clamped (level 0 → H1)', () => {
    const json = jsonDoc([
      { type: 'heading', attrs: { level: 0 }, content: [{ type: 'text', text: 'X' }] }
    ])
    const block = tiptapToPdfContent(json, emptySizes)[0] as PdfTextBlockLike
    expect(block.fontSize).toBe(HEADING_SIZES[0])
  })

  test('heading level 9 clamped to H6', () => {
    const json = jsonDoc([
      { type: 'heading', attrs: { level: 9 }, content: [{ type: 'text', text: 'X' }] }
    ])
    const block = tiptapToPdfContent(json, emptySizes)[0] as PdfTextBlockLike
    expect(block.fontSize).toBe(HEADING_SIZES[5])
  })
})

describe('tiptapToPdfContent — lists', () => {
  test('bulletList → ul', () => {
    const json = jsonDoc([
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'item A' }] }
            ]
          }
        ]
      }
    ])
    const block = tiptapToPdfContent(json, emptySizes)[0] as PdfListLike
    expect(Array.isArray(block.ul)).toBe(true)
    expect(block.ul).toHaveLength(1)
  })

  test('orderedList → ol', () => {
    const json = jsonDoc([
      {
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'item 1' }] }
            ]
          },
          {
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'item 2' }] }
            ]
          }
        ]
      }
    ])
    const block = tiptapToPdfContent(json, emptySizes)[0] as PdfListLike
    expect(Array.isArray(block.ol)).toBe(true)
    expect(block.ol).toHaveLength(2)
  })

  test('list with empty items dropped', () => {
    const json = jsonDoc([{ type: 'bulletList', content: [] }])
    expect(tiptapToPdfContent(json, emptySizes)).toEqual([])
  })
})

describe('tiptapToPdfContent — blockquote', () => {
  test('blockquote with paragraph', () => {
    const json = jsonDoc([
      {
        type: 'blockquote',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'quoted' }] }
        ]
      }
    ])
    const block = tiptapToPdfContent(json, emptySizes)[0] as { stack: unknown[]; italics: boolean }
    expect(Array.isArray(block.stack)).toBe(true)
    expect(block.italics).toBe(true)
  })
})

describe('tiptapToPdfContent — codeBlock', () => {
  test('codeBlock → table with gray fill (no monospace; see pdfGenerator note)', () => {
    const json = jsonDoc([
      {
        type: 'codeBlock',
        content: [{ type: 'text', text: 'const x = 1' }]
      }
    ])
    const block = tiptapToPdfContent(json, emptySizes)[0] as PdfTableLike
    expect(block.table.body).toBeDefined()
    const cell = block.table.body[0][0] as { text: string; fillColor: string }
    expect(cell.text).toBe('const x = 1')
    expect(cell.fillColor).toBe(CODE_BG)
  })

  test('empty codeBlock dropped', () => {
    const json = jsonDoc([{ type: 'codeBlock', content: [] }])
    expect(tiptapToPdfContent(json, emptySizes)).toEqual([])
  })
})

describe('tiptapToPdfContent — horizontalRule', () => {
  test('hr → canvas line', () => {
    const json = jsonDoc([{ type: 'horizontalRule' }])
    const block = tiptapToPdfContent(json, emptySizes)[0] as PdfCanvasLike
    expect(block.canvas[0].type).toBe('line')
  })
})

describe('tiptapToPdfContent — images', () => {
  test('image with natural size in map → width = natural pt', () => {
    const src = 'data:image/png;base64,AAA'
    const sizes: ImageSizeMap = new Map([[src, { widthPt: 150, heightPt: 100 }]])
    const json = jsonDoc([{ type: 'image', attrs: { src } }])
    const block = tiptapToPdfContent(json, sizes)[0] as PdfImageLike
    expect(block.image).toBe(src)
    expect(block.width).toBe(150)
    expect(block.fit).toBeUndefined()
  })

  test('image larger than image max width → fit', () => {
    const src = 'data:image/png;base64,BBB'
    const sizes: ImageSizeMap = new Map([[src, { widthPt: 1500, heightPt: 1000 }]])
    const json = jsonDoc([{ type: 'image', attrs: { src } }])
    const block = tiptapToPdfContent(json, sizes)[0] as PdfImageLike
    expect(block.fit).toEqual([IMAGE_MAX_WIDTH_PT, IMAGE_MAX_HEIGHT_PT])
    expect(block.width).toBeUndefined()
  })

  test('image with unknown size in map → fit (defensive)', () => {
    const src = 'data:image/png;base64,CCC'
    const json = jsonDoc([{ type: 'image', attrs: { src } }])
    const block = tiptapToPdfContent(json, emptySizes)[0] as PdfImageLike
    expect(block.fit).toEqual([IMAGE_MAX_WIDTH_PT, IMAGE_MAX_HEIGHT_PT])
  })

  test('image without src dropped', () => {
    const json = jsonDoc([{ type: 'image', attrs: {} }])
    expect(tiptapToPdfContent(json, emptySizes)).toEqual([])
  })
})

describe('tiptapToPdfContent — unknown node fallback', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('unknown node with text extracted + warn emitted', () => {
    const json = jsonDoc([
      {
        type: 'mention',
        content: [{ type: 'text', text: 'extracted fallback' }]
      }
    ])
    const block = tiptapToPdfContent(json, emptySizes)[0] as { text: string; italics: boolean }
    expect(block.text).toBe('extracted fallback')
    expect(block.italics).toBe(true)
    const warnMock = vi.mocked(console.warn)
    expect(warnMock).toHaveBeenCalledTimes(1)
    const firstCallArg = warnMock.mock.calls[0][0] as string
    expect(firstCallArg).toContain('mention')
  })

  test('unknown node with no extractable text dropped', () => {
    const json = jsonDoc([{ type: 'embed' }])
    expect(tiptapToPdfContent(json, emptySizes)).toEqual([])
  })
})

describe('tiptapToPdfContent — ordering', () => {
  test('prose → image → prose → image preserved', () => {
    const src1 = 'data:image/png;base64,X1'
    const src2 = 'data:image/png;base64,X2'
    const sizes: ImageSizeMap = new Map([
      [src1, { widthPt: 100, heightPt: 80 }],
      [src2, { widthPt: 100, heightPt: 80 }]
    ])
    const json = jsonDoc([
      { type: 'paragraph', content: [{ type: 'text', text: 'A' }] },
      { type: 'image', attrs: { src: src1 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'B' }] },
      { type: 'image', attrs: { src: src2 } }
    ])
    const result = tiptapToPdfContent(json, sizes) as Array<{ image?: string; text?: unknown }>
    expect(result).toHaveLength(4)
    expect(result[1].image).toBe(src1)
    expect(result[3].image).toBe(src2)
  })
})
