import type { TDocumentDefinitions } from 'pdfmake/interfaces'

// Note: pdfmake VFS in Electron renderer ships only Roboto.
// Standard PDF fonts (Courier, Helvetica, Times) require .afm files in VFS
// which aren't bundled with vfs_fonts.js. Code blocks therefore use Roboto
// with gray background for visual distinction instead of monospace.
const FONT_REGISTRY = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
}

export async function createPdfBase64(docDefinition: TDocumentDefinitions): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMakeRaw = (await import('pdfmake/build/pdfmake' as string)) as any
  const pdfMake = pdfMakeRaw.default ?? pdfMakeRaw
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vfsFontsRaw = (await import('pdfmake/build/vfs_fonts' as string)) as any
  const vfsFonts = vfsFontsRaw.default ?? vfsFontsRaw
  pdfMake.addVirtualFileSystem(vfsFonts)
  pdfMake.fonts = FONT_REGISTRY
  return pdfMake.createPdf(docDefinition).getBase64()
}
