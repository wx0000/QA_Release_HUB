import type { Content } from 'pdfmake/interfaces'
import { computeImageSize, type ImageSize } from './imageHelper'
import {
  TEXT_COLUMN_WIDTH_PT,
  IMAGE_MAX_WIDTH_PT,
  IMAGE_MAX_HEIGHT_PT,
  HEADING_SIZES,
  CODE_BG,
  BLOCKQUOTE_BORDER,
  IMAGE_MARGIN,
  PARAGRAPH_MARGIN,
  HEADING_MARGIN,
  LABEL_TEXT_COLOR
} from './constants'

export interface TipTapMark {
  type: string
}

export interface TipTapNode {
  type: string
  text?: string
  marks?: TipTapMark[]
  attrs?: { src?: string; level?: number; language?: string }
  content?: TipTapNode[]
}

export interface PdfRun {
  text: string
  bold?: boolean
  italics?: boolean
  decoration?: 'underline' | 'lineThrough'
  background?: string
}

export type ImageSizeMap = ReadonlyMap<string, ImageSize>

function textNodeToRun(node: TipTapNode): PdfRun {
  const run: PdfRun = { text: node.text ?? '' }
  if (!node.marks) return run
  for (const mark of node.marks) {
    if (mark.type === 'bold') run.bold = true
    else if (mark.type === 'italic') run.italics = true
    else if (mark.type === 'underline') run.decoration = 'underline'
    else if (mark.type === 'strike') run.decoration = 'lineThrough'
    else if (mark.type === 'code') {
      run.background = CODE_BG
    }
  }
  return run
}

function inlinesToRuns(nodes: TipTapNode[]): PdfRun[] {
  return nodes.flatMap<PdfRun>(child => {
    if (child.type === 'text' && typeof child.text === 'string' && child.text.length > 0) {
      return [textNodeToRun(child)]
    }
    if (child.type === 'hardBreak') return [{ text: '\n' }]
    if (Array.isArray(child.content)) return inlinesToRuns(child.content)
    return []
  })
}

function paragraphToPdf(node: TipTapNode): Content | null {
  const runs = inlinesToRuns(node.content ?? [])
  if (runs.length === 0) return null
  return { text: runs, margin: PARAGRAPH_MARGIN } as Content
}

function headingToPdf(node: TipTapNode): Content | null {
  const runs = inlinesToRuns(node.content ?? [])
  if (runs.length === 0) return null
  const rawLevel = node.attrs?.level ?? 1
  const level = Math.min(Math.max(rawLevel, 1), 6)
  const fontSize = HEADING_SIZES[level - 1]
  return { text: runs, fontSize, bold: true, margin: HEADING_MARGIN } as Content
}

function listItemToPdf(node: TipTapNode, imageSizes: ImageSizeMap): Content | null {
  if (!Array.isArray(node.content)) return null
  const inner = blockNodesToPdf(node.content, imageSizes)
  if (inner.length === 0) return null
  return inner.length === 1 ? inner[0] : ({ stack: inner } as Content)
}

function listToPdf(node: TipTapNode, imageSizes: ImageSizeMap, ordered: boolean): Content | null {
  const items = (node.content ?? [])
    .map(li => listItemToPdf(li, imageSizes))
    .filter((x): x is Content => x !== null)

  if (items.length === 0) return null
  return ordered
    ? ({ ol: items, margin: PARAGRAPH_MARGIN } as Content)
    : ({ ul: items, margin: PARAGRAPH_MARGIN } as Content)
}

function blockquoteToPdf(node: TipTapNode, imageSizes: ImageSizeMap): Content | null {
  if (!Array.isArray(node.content)) return null
  const inner = blockNodesToPdf(node.content, imageSizes)
  if (inner.length === 0) return null
  return {
    stack: inner,
    margin: [12, 4, 0, 4],
    italics: true,
    color: LABEL_TEXT_COLOR
  } as Content
}

function codeBlockToPdf(node: TipTapNode): Content | null {
  const text = (node.content ?? [])
    .filter(c => c.type === 'text')
    .map(c => c.text ?? '')
    .join('')
  if (text.length === 0) return null
  return {
    table: {
      widths: ['*'],
      body: [[{
        text,
        fillColor: CODE_BG,
        margin: [6, 4, 6, 4],
        preserveLeadingSpaces: true
      }]]
    },
    layout: 'noBorders',
    margin: [0, 4, 0, 4]
  } as Content
}

function horizontalRuleToPdf(): Content {
  return {
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 4,
        x2: TEXT_COLUMN_WIDTH_PT,
        y2: 4,
        lineWidth: 0.5,
        lineColor: BLOCKQUOTE_BORDER
      }
    ],
    margin: [0, 6, 0, 10]
  } as Content
}

function imageNodeToPdf(node: TipTapNode, imageSizes: ImageSizeMap): Content | null {
  const src = node.attrs?.src
  if (typeof src !== 'string' || src.length === 0) return null
  const natural = imageSizes.get(src)
  if (!natural) {
    return {
      image: src,
      fit: [IMAGE_MAX_WIDTH_PT, IMAGE_MAX_HEIGHT_PT],
      margin: IMAGE_MARGIN
    } as Content
  }
  const decision = computeImageSize(natural)
  if (decision.kind === 'natural') {
    return { image: src, width: decision.widthPt, margin: IMAGE_MARGIN } as Content
  }
  return {
    image: src,
    fit: [decision.maxWidthPt, decision.maxHeightPt],
    margin: IMAGE_MARGIN
  } as Content
}

function extractText(node: TipTapNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.content)) return node.content.map(extractText).join('')
  return ''
}

function fallbackUnknownNode(node: TipTapNode): Content | null {
  console.warn(`tiptapToPdfContent: unknown node type "${node.type}", falling back to text extraction`)
  const text = extractText(node)
  if (text.length === 0) return null
  return {
    text,
    margin: PARAGRAPH_MARGIN,
    italics: true,
    color: LABEL_TEXT_COLOR
  } as Content
}

function blockNodeToPdf(node: TipTapNode, imageSizes: ImageSizeMap): Content | null {
  switch (node.type) {
    case 'paragraph':       return paragraphToPdf(node)
    case 'heading':         return headingToPdf(node)
    case 'bulletList':      return listToPdf(node, imageSizes, false)
    case 'orderedList':     return listToPdf(node, imageSizes, true)
    case 'blockquote':      return blockquoteToPdf(node, imageSizes)
    case 'codeBlock':       return codeBlockToPdf(node)
    case 'horizontalRule':  return horizontalRuleToPdf()
    case 'image':           return imageNodeToPdf(node, imageSizes)
    default:                return fallbackUnknownNode(node)
  }
}

function blockNodesToPdf(nodes: TipTapNode[], imageSizes: ImageSizeMap): Content[] {
  return nodes
    .map(n => blockNodeToPdf(n, imageSizes))
    .filter((x): x is Content => x !== null)
}

export function tiptapToPdfContent(json: string, imageSizes: ImageSizeMap): Content[] {
  if (!json) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return []
  }
  if (typeof parsed !== 'object' || parsed === null) return []
  const doc = parsed as TipTapNode
  if (!Array.isArray(doc.content)) return []
  return blockNodesToPdf(doc.content, imageSizes)
}
