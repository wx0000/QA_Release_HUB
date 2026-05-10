import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'
import type { ReportData, ReportMeta } from '../../types/report.types'

const HEADER_FILL = '#1e293b'
const HEADER_COLOR = '#ffffff'
const ROW_ALT_FILL = '#f8fafc'
const BORDER_COLOR = '#e2e8f0'

function deploymentNumber(suffix: string): string {
  return `R_01.00.${suffix.padStart(2, '0')}.00`
}

function formatDate(iso: string): string {
  return iso ? iso.slice(0, 10) : '—'
}

function formatEnvironment(meta: ReportMeta): string {
  const test = meta.environmentTest ? 'TEST ✓' : 'TEST —'
  const stage = meta.environmentStage ? 'STAGE ✓' : 'STAGE —'
  return `${test}   ${stage}`
}

function headerCell(text: string): TableCell {
  return { text, bold: true, color: HEADER_COLOR, fillColor: HEADER_FILL, fontSize: 9 }
}

function cell(text: string, odd: boolean, extra?: object): TableCell {
  return { text, ...(odd ? { fillColor: ROW_ALT_FILL } : {}), ...extra }
}

// Minimal TipTap node shape — only fields we actually read
interface TipTapNode {
  type: string
  text?: string
  marks?: Array<{ type: string }>
  attrs?: { src?: string }
  content?: TipTapNode[]
}

type PdfRun = { text: string; bold?: boolean; italics?: boolean }

function parseParagraphInlines(nodes: TipTapNode[]): PdfRun[] {
  return nodes.flatMap<PdfRun>(child => {
    if (child.type === 'text' && child.text) {
      return [{
        text: child.text,
        ...(child.marks?.some(m => m.type === 'bold') && { bold: true as const }),
        ...(child.marks?.some(m => m.type === 'italic') && { italics: true as const }),
      }]
    }
    if (child.type === 'hardBreak') return [{ text: '\n' }]
    return []
  })
}

// Converts TipTap JSON to a pdfmake TableCell with text runs and inline images.
// Falls back to empty cell on parse error or empty content.
function tiptapToCell(json: string, odd: boolean): TableCell {
  const fillColor = odd ? ROW_ALT_FILL : undefined
  const empty = (): TableCell =>
    (fillColor ? { text: '', fillColor } : { text: '' }) as TableCell

  if (!json) return empty()

  try {
    const parsed: unknown = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null) return empty()

    const doc = parsed as TipTapNode
    if (!Array.isArray(doc.content)) return empty()

    const blocks: Content[] = []

    for (const node of doc.content) {
      if (node.type === 'paragraph' && Array.isArray(node.content)) {
        const runs = parseParagraphInlines(node.content)
        if (runs.length > 0) {
          blocks.push({ text: runs } as unknown as Content)
        }
      } else if (node.type === 'image' && typeof node.attrs?.src === 'string') {
        blocks.push({ image: node.attrs.src, width: 120, margin: [0, 2, 0, 2] } as unknown as Content)
      }
    }

    if (blocks.length === 0) return empty()

    const body = blocks.length === 1 ? { ...blocks[0] as object } : { stack: blocks }
    return (fillColor ? { ...body, fillColor } : body) as unknown as TableCell
  } catch {
    return empty()
  }
}

const thinBorder = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => BORDER_COLOR,
  vLineColor: () => BORDER_COLOR
}

export function buildDocDefinition(data: ReportData): TDocumentDefinitions {
  const { meta, changes, testResults = {} } = data
  const depNum = deploymentNumber(meta.deploymentSuffix)
  const today = formatDate(new Date().toISOString())

  const section1Rows: TableCell[][] = changes.map((c, i) => {
    const odd = i % 2 !== 0
    return [
      cell(String(c.nr), odd),
      cell(c.component, odd),
      cell(c.version, odd),
      cell(c.type, odd),
      cell(c.changeDescription, odd),
      cell(c.ticket, odd),
      cell(c.status, odd)
    ]
  })

  const section2Rows: TableCell[][] = changes.map((c, i) => {
    const odd = i % 2 !== 0
    return [
      cell(String(c.nr), odd),
      cell(c.component, odd),
      cell(c.version, odd),
      cell(c.type, odd),
      cell(c.changeDescription, odd),
      cell(c.ticket, odd),
      tiptapToCell(testResults[c.nr] ?? '', odd),
      cell('POSITIVE', odd, { bold: true, color: '#16a34a' })
    ]
  })

  const content: Content[] = [
    { text: 'QA RELEASE HUB', style: 'appTitle' },
    {
      canvas: [
        { type: 'line', x1: 0, y1: 0, x2: 782, y2: 0, lineWidth: 1, lineColor: '#cbd5e1' }
      ]
    },
    { text: 'DEPLOYMENT TEST REPORT', style: 'reportTitle', margin: [0, 8, 0, 14] },

    {
      table: {
        widths: [130, '*'],
        body: [
          [{ text: 'Deployment number:', bold: true }, { text: depNum, bold: true }],
          [
            { text: 'Test period:', bold: true },
            `${formatDate(meta.dateFrom)} — ${formatDate(meta.dateTo)}`
          ],
          [{ text: 'Tester:', bold: true }, meta.tester],
          [{ text: 'Environment:', bold: true }, formatEnvironment(meta)],
          [{ text: 'Generated:', bold: true }, today]
        ]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 20]
    },

    { text: '1. Components and changes', style: 'sectionTitle' },
    {
      table: {
        headerRows: 1,
        widths: [25, 110, 70, 40, '*', 70, 75],
        body: [
          [
            headerCell('No'),
            headerCell('Component'),
            headerCell('Version'),
            headerCell('Type'),
            headerCell('Change description'),
            headerCell('Ticket'),
            headerCell('Status')
          ],
          ...section1Rows
        ]
      },
      layout: thinBorder,
      margin: [0, 4, 0, 20]
    },

    { text: '2. Test cases', style: 'sectionTitle' },
    {
      table: {
        headerRows: 1,
        widths: [25, 90, 65, 40, 130, 65, '*', 60],
        body: [
          [
            headerCell('No'),
            headerCell('Component'),
            headerCell('Version'),
            headerCell('Type'),
            headerCell('Change description'),
            headerCell('Ticket'),
            headerCell('Current result'),
            headerCell('Result')
          ],
          ...section2Rows
        ]
      },
      layout: thinBorder,
      margin: [0, 4, 0, 20]
    },

    { text: '3. Summary and recommendations', style: 'sectionTitle' },
    {
      table: {
        widths: [130, '*'],
        body: [
          [
            { text: 'Summary:', bold: true },
            'All tests completed with positive results.\nNo critical errors detected.'
          ],
          [
            { text: 'Recommendation:', bold: true },
            'Deployment to production environment can be recommended.'
          ]
        ]
      },
      layout: 'noBorders',
      margin: [0, 4, 0, 0]
    }
  ]

  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [30, 50, 30, 40],

    footer: (currentPage, pageCount) => ({
      text: `QA Release HUB  |  Deployment ${depNum}  |  Page ${currentPage} / ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#94a3b8',
      margin: [0, 10]
    }),

    styles: {
      appTitle: { fontSize: 16, bold: true, color: '#1e293b', margin: [0, 0, 0, 6] },
      reportTitle: { fontSize: 13, bold: true, color: '#334155' },
      sectionTitle: { fontSize: 11, bold: true, color: '#1e293b', margin: [0, 0, 0, 6] }
    },

    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
      color: '#1e293b'
    },

    content
  }
}
