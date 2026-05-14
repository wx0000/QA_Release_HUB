import type { Content, TableCell } from 'pdfmake/interfaces'
import type { ParsedChange } from '../../types/report.types'
import {
  LABELS,
  componentBlockAnchor,
  HEADER_FILL,
  HEADER_COLOR,
  ROW_ALT_FILL,
  BORDER_COLOR,
  POSITIVE_COLOR
} from './constants'

function headerCell(text: string): TableCell {
  return {
    text,
    bold: true,
    color: HEADER_COLOR,
    fillColor: HEADER_FILL,
    fontSize: 9
  }
}

function linkCell(
  content: TableCell,
  linkToDestination: string,
  fillColor: string | undefined
): TableCell {
  if (typeof content === 'string') {
    return { text: content, linkToDestination, fillColor }
  }
  if (typeof content === 'number') {
    return { text: String(content), linkToDestination, fillColor }
  }
  return { ...(content as object), linkToDestination, fillColor } as TableCell
}

// Cell that renders the auto-resolved page number via pdfmake's `pageReference`.
// We deliberately do NOT set `linkToDestination` here: pdfmake auto-hyperlinks
// pageReference text to its anchor, and adding linkToDestination on the same
// cell would conflict with that auto-link.
function pageReferenceCell(anchor: string, fillColor: string | undefined): TableCell {
  return { pageReference: anchor, fillColor } as unknown as TableCell
}

function row(change: ParsedChange, odd: boolean): TableCell[] {
  const fill = odd ? ROW_ALT_FILL : undefined
  const anchor = componentBlockAnchor(change.nr)

  return [
    linkCell({ text: String(change.nr) } as TableCell, anchor, fill),
    linkCell({ text: change.component } as TableCell, anchor, fill),
    linkCell({ text: change.version } as TableCell, anchor, fill),
    linkCell(
      { text: LABELS.RESULT_POSITIVE, color: POSITIVE_COLOR, bold: true } as TableCell,
      anchor,
      fill
    ),
    pageReferenceCell(anchor, fill)
  ]
}

// TOC_ANCHOR lives on the Section 2 title in reportTemplate.ts — that title is
// a substantial text node that pdfmake reliably registers as an anchor target.
// This builder only emits the table.
export function buildSection2TOC(changes: readonly ParsedChange[]): Content[] {
  if (changes.length === 0) return []

  const tableBody: TableCell[][] = [
    [
      headerCell(LABELS.TOC_COL_NR),
      headerCell(LABELS.TOC_COL_COMPONENT),
      headerCell(LABELS.TOC_COL_VERSION),
      headerCell(LABELS.TOC_COL_RESULT),
      headerCell(LABELS.TOC_COL_PAGE)
    ],
    ...changes.map((c, i) => row(c, i % 2 !== 0))
  ]

  const table: Content = {
    table: {
      headerRows: 1,
      widths: [30, '*', 80, 80, 50],
      body: tableBody
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => BORDER_COLOR,
      vLineColor: () => BORDER_COLOR
    },
    margin: [0, 4, 0, 16]
  } as Content

  return [table]
}
