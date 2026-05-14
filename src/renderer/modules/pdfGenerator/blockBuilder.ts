import type { Content } from 'pdfmake/interfaces'
import type { ParsedChange, ChangeType } from '../../types/report.types'
import { tiptapToPdfContent, type ImageSizeMap } from './tiptapToPdfContent'
import {
  LABELS,
  componentBlockAnchor,
  BLOCK_HEADER_FILL,
  LABEL_TEXT_COLOR,
  LABEL_FONT_SIZE,
  BLOCK_HEADER_TITLE_FONT_SIZE,
  BLOCK_HEADER_MARGIN,
  PLACEHOLDER_MARGIN,
  POSITIVE_COLOR,
  SUBTLE_TEXT_COLOR,
  MOD_BADGE_BG,
  MOD_BADGE_TEXT,
  FIX_BADGE_BG,
  FIX_BADGE_TEXT
} from './constants'

interface TipTapProbe {
  type?: string
  text?: string
  attrs?: { src?: string }
  content?: TipTapProbe[]
}

function badgeColors(type: ChangeType): { bg: string; fg: string } {
  if (type === 'FIX') return { bg: FIX_BADGE_BG, fg: FIX_BADGE_TEXT }
  return { bg: MOD_BADGE_BG, fg: MOD_BADGE_TEXT }
}

function typeBadge(type: ChangeType): Content {
  const colors = badgeColors(type)
  return {
    table: {
      widths: ['auto'],
      body: [[
        {
          text: type,
          color: colors.fg,
          fillColor: colors.bg,
          bold: true,
          fontSize: LABEL_FONT_SIZE,
          margin: [5, 1, 5, 1],
          alignment: 'center'
        }
      ]]
    },
    layout: 'noBorders'
  } as Content
}

function headerTopRow(change: ParsedChange): Content {
  const titleText = `${change.nr}. ${change.component}  ${change.version}`
  return {
    columns: [
      {
        width: 'auto',
        text: titleText,
        bold: true,
        fontSize: BLOCK_HEADER_TITLE_FONT_SIZE
      },
      { width: '*', text: '' },
      {
        width: 'auto',
        text: [
          { text: `${LABELS.BLOCK_TICKET_LABEL} `, color: LABEL_TEXT_COLOR },
          { text: change.ticket || '—' }
        ],
        margin: [0, 3, 0, 0]
      },
      {
        width: 'auto',
        text: LABELS.RESULT_POSITIVE,
        color: POSITIVE_COLOR,
        bold: true,
        margin: [14, 3, 0, 0]
      }
    ],
    columnGap: 0
  } as Content
}

function headerBottomRow(change: ParsedChange): Content {
  return {
    columns: [
      {
        width: 'auto',
        stack: [typeBadge(change.type)]
      },
      {
        width: '*',
        text: ` : ${change.changeDescription}`,
        margin: [4, 2, 0, 0]
      }
    ],
    columnGap: 0,
    margin: [0, 8, 0, 0]
  } as Content
}

// Anchor is a tiny invisible text node carrying `id` + `pageBreak: 'before'`.
// pdfmake registers anchors most reliably on text nodes (table-wrapper anchors
// get lost when pdfmake decomposes the table into cells during layout, which
// causes "Page reference id not found" crashes from TOC pageReference).
function buildAnchor(change: ParsedChange): Content {
  // Margin [0, 2, 0, 0] (not [0,0,0,0]) gives the anchor a non-zero vertical
  // position so pdfmake registers it as a linkable target. Zero-margin
  // anchors are sometimes skipped during layout → linkToDestination fails.
  return {
    id: componentBlockAnchor(change.nr),
    pageBreak: 'before',
    text: ' ',
    fontSize: 1,
    margin: [0, 2, 0, 0]
  } as Content
}

function buildHeaderTable(change: ParsedChange): Content {
  return {
    unbreakable: true,
    table: {
      widths: ['*'],
      body: [[
        {
          fillColor: BLOCK_HEADER_FILL,
          margin: [10, 8, 10, 8],
          stack: [headerTopRow(change), headerBottomRow(change)]
        }
      ]]
    },
    layout: 'noBorders',
    margin: BLOCK_HEADER_MARGIN
  } as Content
}

function placeholderContent(): Content {
  return {
    text: LABELS.BLOCK_NO_TEST_CONTENT,
    italics: true,
    color: SUBTLE_TEXT_COLOR,
    margin: PLACEHOLDER_MARGIN
  }
}

// Returns true iff the TipTap JSON contains at least one visible item:
// non-whitespace text, an image with src, a horizontal rule, or a code block with content.
// Empty paragraphs and whitespace-only text runs are considered invisible.
export function hasVisibleContent(json: string): boolean {
  if (typeof json !== 'string' || json.length === 0) return false
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return false
  }
  if (typeof parsed !== 'object' || parsed === null) return false
  return walkVisible(parsed as TipTapProbe)
}

function walkVisible(node: TipTapProbe): boolean {
  if (node.type === 'image' && typeof node.attrs?.src === 'string' && node.attrs.src.length > 0) {
    return true
  }
  if (node.type === 'horizontalRule') return true
  if (node.type === 'text' && typeof node.text === 'string' && node.text.trim().length > 0) {
    return true
  }
  if (Array.isArray(node.content)) {
    return node.content.some(walkVisible)
  }
  return false
}

export function buildComponentBlock(
  change: ParsedChange,
  currentResult: string,
  imageSizes: ImageSizeMap
): Content[] {
  const contentBody = hasVisibleContent(currentResult)
    ? tiptapToPdfContent(currentResult, imageSizes)
    : [placeholderContent()]

  return [buildAnchor(change), buildHeaderTable(change), ...contentBody]
}
