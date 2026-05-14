import { describe, test, expect } from 'vitest'
import { collectImageSrcs, resolveImageDimensions, type ImageLoader } from './resolveImageDimensions'
import type { ImageSize } from './imageHelper'

function doc(content: unknown): string {
  return JSON.stringify({ type: 'doc', content })
}

describe('collectImageSrcs', () => {
  test('empty record → empty set', () => {
    expect(collectImageSrcs({}).size).toBe(0)
  })

  test('malformed JSON skipped', () => {
    const result = collectImageSrcs({ 1: 'not-json{', 2: '' })
    expect(result.size).toBe(0)
  })

  test('paragraph without image → empty', () => {
    const result = collectImageSrcs({
      1: doc([{ type: 'paragraph', content: [{ type: 'text', text: 'plain' }] }])
    })
    expect(result.size).toBe(0)
  })

  test('single image collected', () => {
    const src = 'data:image/png;base64,AAA'
    const result = collectImageSrcs({
      1: doc([{ type: 'image', attrs: { src } }])
    })
    expect(result).toEqual(new Set([src]))
  })

  test('nested images (inside listItem → paragraph) collected', () => {
    const srcA = 'data:image/png;base64,A'
    const srcB = 'data:image/png;base64,B'
    const result = collectImageSrcs({
      1: doc([
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [] },
                { type: 'image', attrs: { src: srcA } }
              ]
            }
          ]
        },
        { type: 'image', attrs: { src: srcB } }
      ])
    })
    expect(result).toEqual(new Set([srcA, srcB]))
  })

  test('duplicate srcs deduplicated across multiple testResults', () => {
    const src = 'data:image/png;base64,DUP'
    const result = collectImageSrcs({
      1: doc([{ type: 'image', attrs: { src } }]),
      2: doc([{ type: 'image', attrs: { src } }])
    })
    expect(result.size).toBe(1)
  })

  test('image node without src ignored', () => {
    const result = collectImageSrcs({
      1: doc([{ type: 'image', attrs: {} }])
    })
    expect(result.size).toBe(0)
  })
})

describe('resolveImageDimensions', () => {
  test('returns empty Map when no images', async () => {
    const loader: ImageLoader = async () => ({ widthPt: 0, heightPt: 0 })
    const result = await resolveImageDimensions({}, loader)
    expect(result.size).toBe(0)
  })

  test('resolves all unique images via injected loader', async () => {
    const srcA = 'data:image/png;base64,A'
    const srcB = 'data:image/png;base64,B'
    const fixedSizes: Record<string, ImageSize> = {
      [srcA]: { widthPt: 100, heightPt: 80 },
      [srcB]: { widthPt: 500, heightPt: 300 }
    }
    const loader: ImageLoader = async src => fixedSizes[src]
    const result = await resolveImageDimensions(
      {
        1: doc([{ type: 'image', attrs: { src: srcA } }]),
        2: doc([{ type: 'image', attrs: { src: srcB } }])
      },
      loader
    )
    expect(result.get(srcA)).toEqual({ widthPt: 100, heightPt: 80 })
    expect(result.get(srcB)).toEqual({ widthPt: 500, heightPt: 300 })
  })

  test('loader failure → zero dimensions placeholder (graceful)', async () => {
    const src = 'data:image/png;base64,BROKEN'
    const loader: ImageLoader = async () => {
      throw new Error('decode failed')
    }
    const result = await resolveImageDimensions(
      { 1: doc([{ type: 'image', attrs: { src } }]) },
      loader
    )
    expect(result.get(src)).toEqual({ widthPt: 0, heightPt: 0 })
  })

  test('loader called once per unique src (dedupe)', async () => {
    const src = 'data:image/png;base64,SAME'
    let calls = 0
    const loader: ImageLoader = async () => {
      calls += 1
      return { widthPt: 50, heightPt: 50 }
    }
    await resolveImageDimensions(
      {
        1: doc([{ type: 'image', attrs: { src } }]),
        2: doc([{ type: 'image', attrs: { src } }]),
        3: doc([{ type: 'image', attrs: { src } }])
      },
      loader
    )
    expect(calls).toBe(1)
  })
})
