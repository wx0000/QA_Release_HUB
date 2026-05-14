// Dimensions
// Page: A4 landscape = 595pt height × 842pt width. With 30pt left+right margins → 782pt usable width.
// Vertical usable: 595 - 50 (top) - 40 (bottom) = 505pt → IMAGE_MAX_HEIGHT_PT capped at 480pt
// leaves ~25pt breathing room for footer overlap protection.
// TEXT_COLUMN_WIDTH_PT and IMAGE_MAX_WIDTH_PT are intentionally separate constants
// (currently both 782) so a future change to text vs image width can be made independently.
export const PAGE_INNER_WIDTH_LANDSCAPE_PT = 782
export const TEXT_COLUMN_WIDTH_PT = 782
export const IMAGE_MAX_WIDTH_PT = 782
export const IMAGE_MAX_HEIGHT_PT = 480
export const PX_TO_PT_RATIO = 72 / 96

// Colors — base palette
export const HEADER_FILL = '#1e293b'
export const HEADER_COLOR = '#ffffff'
export const ROW_ALT_FILL = '#f8fafc'
export const BORDER_COLOR = '#e2e8f0'
export const LINE_COLOR = '#cbd5e1'
export const APP_TITLE_COLOR = '#1e293b'
export const REPORT_TITLE_COLOR = '#334155'
export const SECTION_TITLE_COLOR = '#1e293b'
export const BODY_TEXT_COLOR = '#1e293b'
export const SUBTLE_TEXT_COLOR = '#94a3b8'
export const LABEL_TEXT_COLOR = '#475569'

// Block — per-component section 2
export const BLOCK_HEADER_FILL = '#f1f5f9'
export const BLOCK_BORDER_COLOR = '#cbd5e1'

// MOD/FIX badges
export const MOD_BADGE_BG = '#E6F1FB'
export const MOD_BADGE_TEXT = '#0C447C'
export const FIX_BADGE_BG = '#FAEEDA'
export const FIX_BADGE_TEXT = '#854F0B'

// Result
export const POSITIVE_COLOR = '#16a34a'

// Code styling — gray background only (no monospace font; see pdfGenerator.ts).
export const CODE_BG = '#f1f5f9'
export const BLOCKQUOTE_BORDER = '#cbd5e1'

// Anchor IDs (must stay unique within the PDF)
export const TOC_ANCHOR = 'section-2-toc'
export const componentBlockAnchor = (nr: number): string => `componentBlock-${nr}`

// Heading sizes (H1..H6)
export const HEADING_SIZES: readonly [number, number, number, number, number, number] = [
  18, 16, 14, 12, 11, 10
]

// Labels — all user-facing strings (i18n-ready)
export const LABELS = {
  APP_TITLE: 'QA RELEASE HUB',
  REPORT_TITLE: 'DEPLOYMENT TEST REPORT',

  META_DEPLOYMENT_NUMBER: 'Deployment number:',
  META_TEST_PERIOD: 'Test period:',
  META_TESTER: 'Tester:',
  META_ENVIRONMENT: 'Environment:',
  META_GENERATED: 'Generated:',

  SECTION_1_TITLE: '1. Components and changes',
  SECTION_2_TITLE: '2. Test cases',
  SECTION_3_TITLE: '3. Summary and recommendations',

  SECTION_1_HEADER_NR: 'No',
  SECTION_1_HEADER_COMPONENT: 'Component',
  SECTION_1_HEADER_VERSION: 'Version',
  SECTION_1_HEADER_TYPE: 'Type',
  SECTION_1_HEADER_DESCRIPTION: 'Change description',
  SECTION_1_HEADER_TICKET: 'Ticket',
  SECTION_1_HEADER_STATUS: 'Status',

  TOC_COL_NR: 'Nr',
  TOC_COL_COMPONENT: 'Component',
  TOC_COL_VERSION: 'Version',
  TOC_COL_RESULT: 'Result',
  TOC_COL_PAGE: 'Page',

  BLOCK_TICKET_LABEL: 'Ticket:',
  BLOCK_NO_TEST_CONTENT: 'No test content provided',
  RESULT_POSITIVE: 'POSITIVE',

  ENV_TEST: 'TEST',
  ENV_STAGE: 'STAGE',
  ENV_NONE: '—',

  SECTION_3_SUMMARY_LABEL: 'Summary:',
  SECTION_3_SUMMARY_TEXT: 'All tests completed with positive results.\nNo critical errors detected.',
  SECTION_3_RECOMMENDATION_LABEL: 'Recommendation:',
  SECTION_3_RECOMMENDATION_TEXT: 'Deployment to production environment can be recommended.',

  FOOTER_BACK_TO_TOC: 'Back to TOC',
  FOOTER_PAGE: 'Page',
  FOOTER_DEPLOYMENT: 'Deployment',
  FOOTER_APP: 'QA Release HUB',

  PDF_TITLE_SUFFIX: ' — QA Release Report',
  PDF_AUTHOR_FALLBACK: 'QA Release HUB',
  PDF_CREATOR: 'QA Release HUB',
  PDF_SUBJECT: 'QA test report'
} as const

// Margins / paddings
export const PAGE_MARGINS: [number, number, number, number] = [30, 50, 30, 40]
export const BLOCK_HEADER_MARGIN: [number, number, number, number] = [0, 0, 0, 10]
export const PLACEHOLDER_MARGIN: [number, number, number, number] = [0, 20, 0, 0]
export const IMAGE_MARGIN: [number, number, number, number] = [0, 6, 0, 6]
export const PARAGRAPH_MARGIN: [number, number, number, number] = [0, 2, 0, 2]
export const HEADING_MARGIN: [number, number, number, number] = [0, 8, 0, 4]
export const FOOTER_MARGIN: [number, number, number, number] = [30, 10, 30, 0]

// Font sizes
export const DEFAULT_FONT_SIZE = 9
export const FOOTER_FONT_SIZE = 8
export const APP_TITLE_FONT_SIZE = 16
export const REPORT_TITLE_FONT_SIZE = 13
export const SECTION_TITLE_FONT_SIZE = 11
export const BLOCK_HEADER_TITLE_FONT_SIZE = 12
export const LABEL_FONT_SIZE = 8
