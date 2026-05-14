import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces'
import type { ReportData, ReportMeta } from '../../types/report.types'
import { buildComponentBlock } from './blockBuilder'
import { buildSection2TOC } from './tocBuilder'
import { buildFooter } from './footerBuilder'
import type { ImageSizeMap } from './tiptapToPdfContent'
import {
  LABELS,
  TOC_ANCHOR,
  HEADER_FILL,
  HEADER_COLOR,
  ROW_ALT_FILL,
  BORDER_COLOR,
  LINE_COLOR,
  APP_TITLE_COLOR,
  REPORT_TITLE_COLOR,
  SECTION_TITLE_COLOR,
  BODY_TEXT_COLOR,
  APP_TITLE_FONT_SIZE,
  REPORT_TITLE_FONT_SIZE,
  SECTION_TITLE_FONT_SIZE,
  DEFAULT_FONT_SIZE,
  PAGE_MARGINS,
  PAGE_INNER_WIDTH_LANDSCAPE_PT
} from './constants'

function deploymentNumber(suffix: string): string {
  const safe = (suffix || '00').padStart(2, '0')
  return `R_01.00.${safe}.00`
}

function formatDate(iso: string): string {
  return iso ? iso.slice(0, 10) : '—'
}

function formatEnvironment(meta: ReportMeta): string {
  const active: string[] = []
  if (meta.environmentTest) active.push(LABELS.ENV_TEST)
  if (meta.environmentStage) active.push(LABELS.ENV_STAGE)
  return active.length === 0 ? LABELS.ENV_NONE : active.join(', ')
}

function headerCell(text: string): TableCell {
  return { text, bold: true, color: HEADER_COLOR, fillColor: HEADER_FILL, fontSize: 9 }
}

function cell(text: string, odd: boolean, extra?: object): TableCell {
  return { text, ...(odd ? { fillColor: ROW_ALT_FILL } : {}), ...extra }
}

const thinBorder = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => BORDER_COLOR,
  vLineColor: () => BORDER_COLOR
}

export function buildDocDefinition(
  data: ReportData,
  imageSizes: ImageSizeMap
): TDocumentDefinitions {
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

  const section2TOC = buildSection2TOC(changes)
  const section2Blocks = changes.flatMap(c =>
    buildComponentBlock(c, testResults[c.nr] ?? '', imageSizes)
  )

  const footerBuilder = buildFooter(depNum)

  const content: Content[] = [
    { text: LABELS.APP_TITLE, style: 'appTitle' },
    {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: PAGE_INNER_WIDTH_LANDSCAPE_PT,
          y2: 0,
          lineWidth: 1,
          lineColor: LINE_COLOR
        }
      ]
    },
    { text: LABELS.REPORT_TITLE, style: 'reportTitle', margin: [0, 8, 0, 14] },

    {
      table: {
        widths: [130, '*'],
        body: [
          [
            { text: LABELS.META_DEPLOYMENT_NUMBER, bold: true },
            { text: depNum, bold: true }
          ],
          [
            { text: LABELS.META_TEST_PERIOD, bold: true },
            `${formatDate(meta.dateFrom)} — ${formatDate(meta.dateTo)}`
          ],
          [{ text: LABELS.META_TESTER, bold: true }, meta.tester],
          [{ text: LABELS.META_ENVIRONMENT, bold: true }, formatEnvironment(meta)],
          [{ text: LABELS.META_GENERATED, bold: true }, today]
        ]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 20]
    },

    { text: LABELS.SECTION_1_TITLE, style: 'sectionTitle' },
    {
      table: {
        headerRows: 1,
        widths: [25, 110, 70, 40, '*', 70, 75],
        body: [
          [
            headerCell(LABELS.SECTION_1_HEADER_NR),
            headerCell(LABELS.SECTION_1_HEADER_COMPONENT),
            headerCell(LABELS.SECTION_1_HEADER_VERSION),
            headerCell(LABELS.SECTION_1_HEADER_TYPE),
            headerCell(LABELS.SECTION_1_HEADER_DESCRIPTION),
            headerCell(LABELS.SECTION_1_HEADER_TICKET),
            headerCell(LABELS.SECTION_1_HEADER_STATUS)
          ],
          ...section1Rows
        ]
      },
      layout: thinBorder,
      margin: [0, 4, 0, 20]
    },

    {
      id: TOC_ANCHOR,
      text: LABELS.SECTION_2_TITLE,
      style: 'sectionTitle',
      margin: [0, 8, 0, 6]
    },
    ...section2TOC,
    ...section2Blocks,

    {
      text: LABELS.SECTION_3_TITLE,
      style: 'sectionTitle',
      pageBreak: 'before'
    },
    {
      table: {
        widths: [130, '*'],
        body: [
          [
            { text: LABELS.SECTION_3_SUMMARY_LABEL, bold: true },
            LABELS.SECTION_3_SUMMARY_TEXT
          ],
          [
            { text: LABELS.SECTION_3_RECOMMENDATION_LABEL, bold: true },
            LABELS.SECTION_3_RECOMMENDATION_TEXT
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
    pageMargins: PAGE_MARGINS,
    compress: false,

    info: {
      title: `${depNum}${LABELS.PDF_TITLE_SUFFIX}`,
      author: meta.tester || LABELS.PDF_AUTHOR_FALLBACK,
      creator: LABELS.PDF_CREATOR,
      subject: LABELS.PDF_SUBJECT
    },

    footer: footerBuilder.footer,

    styles: {
      appTitle: {
        fontSize: APP_TITLE_FONT_SIZE,
        bold: true,
        color: APP_TITLE_COLOR,
        margin: [0, 0, 0, 6]
      },
      reportTitle: {
        fontSize: REPORT_TITLE_FONT_SIZE,
        bold: true,
        color: REPORT_TITLE_COLOR
      },
      sectionTitle: {
        fontSize: SECTION_TITLE_FONT_SIZE,
        bold: true,
        color: SECTION_TITLE_COLOR,
        margin: [0, 0, 0, 6]
      }
    },

    defaultStyle: {
      font: 'Roboto',
      fontSize: DEFAULT_FONT_SIZE,
      color: BODY_TEXT_COLOR
    },

    content
  }
}
