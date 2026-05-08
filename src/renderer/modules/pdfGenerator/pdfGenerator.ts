import * as pdfMake from 'pdfmake/build/pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts'
import type { TDocumentDefinitions } from 'pdfmake/interfaces'

pdfMake.addVirtualFileSystem(vfsFonts)

export function createPdfBase64(docDefinition: TDocumentDefinitions): Promise<string> {
  return pdfMake.createPdf(docDefinition).getBase64()
}
