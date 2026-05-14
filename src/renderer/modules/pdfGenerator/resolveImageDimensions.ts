import { pxToPt, type ImageSize } from './imageHelper'

interface TipTapProbe {
  type?: string
  attrs?: { src?: string }
  content?: TipTapProbe[]
}

export type ImageLoader = (dataUri: string) => Promise<ImageSize>

export function collectImageSrcs(testResults: Record<number, string>): Set<string> {
  const srcs = new Set<string>()
  for (const json of Object.values(testResults)) {
    if (typeof json !== 'string' || json.length === 0) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      continue
    }
    walkForSrcs(parsed, srcs)
  }
  return srcs
}

function walkForSrcs(node: unknown, srcs: Set<string>): void {
  if (typeof node !== 'object' || node === null) return
  const probe = node as TipTapProbe
  if (probe.type === 'image' && typeof probe.attrs?.src === 'string' && probe.attrs.src.length > 0) {
    srcs.add(probe.attrs.src)
  }
  if (Array.isArray(probe.content)) {
    for (const child of probe.content) walkForSrcs(child, srcs)
  }
}

const defaultLoader: ImageLoader = (dataUri: string) =>
  new Promise<ImageSize>((resolve, reject) => {
    const img = new Image()
    img.onload = () =>
      resolve({
        widthPt: pxToPt(img.naturalWidth),
        heightPt: pxToPt(img.naturalHeight)
      })
    img.onerror = () => reject(new Error(`Failed to load image: ${dataUri.slice(0, 32)}…`))
    img.src = dataUri
  })

export async function resolveImageDimensions(
  testResults: Record<number, string>,
  loader: ImageLoader = defaultLoader
): Promise<Map<string, ImageSize>> {
  const srcs = collectImageSrcs(testResults)
  const entries = await Promise.all(
    Array.from(srcs).map(async (src): Promise<[string, ImageSize]> => {
      try {
        const size = await loader(src)
        return [src, size]
      } catch {
        return [src, { widthPt: 0, heightPt: 0 }]
      }
    })
  )
  return new Map(entries)
}
