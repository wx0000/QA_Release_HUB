import type { TDocumentDefinitions } from 'pdfmake/interfaces'

export async function createPdfBase64(docDefinition: TDocumentDefinitions): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import('pdfmake/build/pdfmake' as string)) as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vfsFonts = (await import('pdfmake/build/vfs_fonts' as string)) as any
  pdfMake.addVirtualFileSystem(vfsFonts)
  return pdfMake.createPdf(docDefinition).getBase64()
}
