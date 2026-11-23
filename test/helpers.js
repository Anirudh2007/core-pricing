import { makeRng } from '../web/lib/rng.js'

export const A = [[10, 6], [7, 4]]
export const B = [[12, 10, 6], [11, 7, 4], [9, 11, 9]]

export function randomMatrix(rng, rows, cols, lo = 0, hi = 20) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => lo + (hi - lo) * rng())
  )
}

export { makeRng }
