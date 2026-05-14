import { describe, test, expect } from 'vitest'
import { pxToPt, computeImageSize } from './imageHelper'
import { IMAGE_MAX_WIDTH_PT, IMAGE_MAX_HEIGHT_PT } from './constants'

describe('pxToPt', () => {
  const cases = [
    { desc: '96 px = 72 pt (1:0.75 ratio)', input: 96, expected: 72 },
    { desc: '0 px = 0 pt', input: 0, expected: 0 },
    { desc: '200 px = 150 pt', input: 200, expected: 150 },
    { desc: '480 px = 360 pt', input: 480, expected: 360 }
  ]

  test.each(cases)('$desc', ({ input, expected }) => {
    expect(pxToPt(input)).toBeCloseTo(expected, 5)
  })
})

describe('computeImageSize — natural branch (both bounds ok)', () => {
  test('small image well below both bounds → natural', () => {
    const result = computeImageSize({ widthPt: 150, heightPt: 100 })
    expect(result).toEqual({ kind: 'natural', widthPt: 150, heightPt: 100 })
  })

  test('natural width and height both within max → natural', () => {
    const result = computeImageSize({ widthPt: 600, heightPt: 400 })
    expect(result).toEqual({ kind: 'natural', widthPt: 600, heightPt: 400 })
  })

  test('exactly at image max width → still natural', () => {
    const result = computeImageSize({ widthPt: IMAGE_MAX_WIDTH_PT, heightPt: 300 })
    expect(result.kind).toBe('natural')
  })

  test('exactly at max height → still natural', () => {
    const result = computeImageSize({ widthPt: 200, heightPt: IMAGE_MAX_HEIGHT_PT })
    expect(result.kind).toBe('natural')
  })
})

describe('computeImageSize — fit branch (scale down)', () => {
  test('wide image exceeding image max width → fit', () => {
    const result = computeImageSize({ widthPt: 1200, heightPt: 400 })
    expect(result).toEqual({
      kind: 'fit',
      maxWidthPt: IMAGE_MAX_WIDTH_PT,
      maxHeightPt: IMAGE_MAX_HEIGHT_PT
    })
  })

  test('natural width but height exceeds max → fit branch', () => {
    // Case from real bug: widthPt=672 < 782, heightPt=576 > 480 → must downscale
    const result = computeImageSize({ widthPt: 672, heightPt: 576 })
    expect(result).toEqual({
      kind: 'fit',
      maxWidthPt: IMAGE_MAX_WIDTH_PT,
      maxHeightPt: IMAGE_MAX_HEIGHT_PT
    })
  })

  test('tall narrow image exceeding height → fit', () => {
    const result = computeImageSize({ widthPt: 150, heightPt: 1500 })
    expect(result).toEqual({
      kind: 'fit',
      maxWidthPt: IMAGE_MAX_WIDTH_PT,
      maxHeightPt: IMAGE_MAX_HEIGHT_PT
    })
  })

  test('huge image exceeding both → fit', () => {
    const result = computeImageSize({ widthPt: 4000, heightPt: 3000 })
    expect(result.kind).toBe('fit')
  })
})

describe('computeImageSize — defensive edge cases', () => {
  test('width=0 → fit (defensive, prevents zero-width render)', () => {
    const result = computeImageSize({ widthPt: 0, heightPt: 100 })
    expect(result.kind).toBe('fit')
  })

  test('height=0 → fit', () => {
    const result = computeImageSize({ widthPt: 100, heightPt: 0 })
    expect(result.kind).toBe('fit')
  })

  test('negative dims → fit', () => {
    const result = computeImageSize({ widthPt: -10, heightPt: -10 })
    expect(result.kind).toBe('fit')
  })

  test('custom bounds honored', () => {
    const result = computeImageSize({ widthPt: 100, heightPt: 100 }, 200, 200)
    expect(result).toEqual({ kind: 'natural', widthPt: 100, heightPt: 100 })
  })

  test('custom bounds — exceeds → fit with custom values', () => {
    const result = computeImageSize({ widthPt: 300, heightPt: 100 }, 200, 200)
    expect(result).toEqual({ kind: 'fit', maxWidthPt: 200, maxHeightPt: 200 })
  })
})
