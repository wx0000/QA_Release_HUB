import type { TDocumentDefinitions } from 'pdfmake/interfaces'

export async function createPdfBase64(docDefinition: TDocumentDefinitions): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMakeRaw = (await import('pdfmake/build/pdfmake' as string)) as any
  const pdfMake = pdfMakeRaw.default ?? pdfMakeRaw
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vfsFontsRaw = (await import('pdfmake/build/vfs_fonts' as string)) as any
  const vfsFonts = vfsFontsRaw.default ?? vfsFontsRaw
  pdfMake.addVirtualFileSystem(vfsFonts)
  return pdfMake.createPdf(docDefinition).getBase64()
}
