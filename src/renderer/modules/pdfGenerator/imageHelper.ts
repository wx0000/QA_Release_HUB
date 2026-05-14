import { PX_TO_PT_RATIO, IMAGE_MAX_WIDTH_PT, IMAGE_MAX_HEIGHT_PT } from './constants'

export interface ImageSize {
  widthPt: number
  heightPt: number
}

export type ImageSizeDecision =
  | { kind: 'natural'; widthPt: number; heightPt: number }
  | { kind: 'fit'; maxWidthPt: number; maxHeightPt: number }

export function pxToPt(px: number): number {
  return px * PX_TO_PT_RATIO
}

// Decides how an image should be rendered in pdfmake:
// - 'natural' when the source fits within the text column and max height as-is
// - 'fit' (scale down) when it exceeds either bound. pdfmake `fit` preserves aspect ratio
//   and never upscales when natural <= bounds, but we branch explicitly to avoid relying
//   on that behavior across pdfmake versions.
export function computeImageSize(
  natural: ImageSize,
  maxWidthPt: number = IMAGE_MAX_WIDTH_PT,
  maxHeightPt: number = IMAGE_MAX_HEIGHT_PT
): ImageSizeDecision {
  if (natural.widthPt <= 0 || natural.heightPt <= 0) {
    return { kind: 'fit', maxWidthPt, maxHeightPt }
  }
  if (natural.widthPt <= maxWidthPt && natural.heightPt <= maxHeightPt) {
    return { kind: 'natural', widthPt: natural.widthPt, heightPt: natural.heightPt }
  }
  return { kind: 'fit', maxWidthPt, maxHeightPt }
}
