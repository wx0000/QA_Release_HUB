import type { Content } from 'pdfmake/interfaces'
import {
  LABELS,
  TOC_ANCHOR,
  FOOTER_FONT_SIZE,
  SUBTLE_TEXT_COLOR,
  FOOTER_MARGIN
} from './constants'

// Simple footer (Option A): assumes Section 1 fits on page 1 and Section 3 on the last page.
// Back-link "↑ Back to TOC" is shown on every page strictly between first and last.
// pdfmake's pageBreakBefore callback is unreliable for non-table nodes in this version,
// so we don't rely on dynamic section tracking — see footerBuilder.test.ts for the rule.
export interface FooterBuilder {
  footer: (currentPage: number, pageCount: number) => Content
}

export function buildFooter(deploymentLabel: string): FooterBuilder {
  return {
    footer(currentPage: number, pageCount: number): Content {
      const leftText = `${LABELS.FOOTER_APP}  |  ${LABELS.FOOTER_DEPLOYMENT} ${deploymentLabel}  |  ${LABELS.FOOTER_PAGE} ${currentPage} / ${pageCount}`
      const showBackLink = currentPage > 1 && currentPage < pageCount

      return {
        columns: [
          {
            width: '*',
            text: leftText,
            alignment: 'left',
            fontSize: FOOTER_FONT_SIZE,
            color: SUBTLE_TEXT_COLOR
          },
          showBackLink
            ? {
                width: 'auto',
                text: LABELS.FOOTER_BACK_TO_TOC,
                linkToDestination: TOC_ANCHOR,
                alignment: 'right',
                fontSize: FOOTER_FONT_SIZE,
                color: SUBTLE_TEXT_COLOR
              }
            : { width: 'auto', text: '' }
        ],
        margin: FOOTER_MARGIN
      } as Content
    }
  }
}
