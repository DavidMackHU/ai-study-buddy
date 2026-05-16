export interface SM2Result {
  interval: number
  easeFactor: number
}

export function computeSM2(
  interval: number,
  easeFactor: number,
  reviewCount: number,
  rating: number,
): SM2Result {
  const r = Math.min(Math.max(rating, 0), 5)
  let newInterval: number
  let newEF = easeFactor

  if (r < 3) {
    newInterval = 1
  } else {
    if (reviewCount === 0) newInterval = 1
    else if (reviewCount === 1) newInterval = 6
    else newInterval = Math.round(interval * easeFactor)

    newEF = easeFactor + (0.1 - (5 - r) * (0.08 + (5 - r) * 0.02))
    newEF = Math.max(1.3, newEF)
  }

  return { interval: newInterval, easeFactor: newEF }
}
