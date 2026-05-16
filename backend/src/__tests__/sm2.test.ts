import { computeSM2 } from '../lib/sm2'

describe('computeSM2', () => {
  test('rating < 3 resets interval to 1 regardless of current state', () => {
    const result = computeSM2(15, 2.5, 5, 2)
    expect(result.interval).toBe(1)
  })

  test('rating 0 resets interval to 1', () => {
    const result = computeSM2(10, 2.5, 3, 0)
    expect(result.interval).toBe(1)
  })

  test('first review (reviewCount 0) with rating >= 3 gives interval 1', () => {
    const result = computeSM2(1, 2.5, 0, 4)
    expect(result.interval).toBe(1)
  })

  test('second review (reviewCount 1) with rating >= 3 gives interval 6', () => {
    const result = computeSM2(1, 2.5, 1, 4)
    expect(result.interval).toBe(6)
  })

  test('subsequent review multiplies interval by ease factor', () => {
    const result = computeSM2(6, 2.5, 2, 4)
    expect(result.interval).toBe(Math.round(6 * 2.5))
  })

  test('rating 5 increases ease factor', () => {
    const result = computeSM2(1, 2.5, 0, 5)
    expect(result.easeFactor).toBeGreaterThan(2.5)
  })

  test('rating 3 decreases ease factor', () => {
    const result = computeSM2(1, 2.5, 0, 3)
    expect(result.easeFactor).toBeLessThan(2.5)
  })

  test('ease factor never drops below 1.3', () => {
    let ef = 2.5
    let iv = 1
    let rc = 0
    for (let i = 0; i < 15; i++) {
      const r = computeSM2(iv, ef, rc, 3)
      iv = r.interval
      ef = r.easeFactor
      rc++
    }
    expect(ef).toBeGreaterThanOrEqual(1.3)
  })

  test('rating is clamped between 0 and 5', () => {
    const low = computeSM2(6, 2.5, 2, -99)
    expect(low.interval).toBe(1)

    const high = computeSM2(6, 2.5, 2, 99)
    expect(high.interval).toBe(Math.round(6 * 2.5))
  })
})
