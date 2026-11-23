import { bestMatching, valueOf, dropRow, dropCol } from './assignment.js'

// Shapley-Shubik: the core is the set of optimal dual solutions. Its
// rider-optimal corner pays each rider their marginal contribution
// V - V(without i); the driver-optimal corner does the same for drivers.
// A matched partner takes the rest of the pair's surplus.
export function corePoints(a) {
  const { value, pairs } = bestMatching(a)
  const m = a.length
  const n = m ? a[0].length : 0
  const RO = { u: Array(m).fill(0), v: Array(n).fill(0) }
  const DO = { u: Array(m).fill(0), v: Array(n).fill(0) }

  for (let i = 0; i < m; i++) RO.u[i] = value - valueOf(dropRow(a, i))
  for (let j = 0; j < n; j++) DO.v[j] = value - valueOf(dropCol(a, j))
  for (const [i, j] of pairs) {
    RO.v[j] = a[i][j] - RO.u[i]
    DO.u[i] = a[i][j] - DO.v[j]
  }

  const mid = (x, y) => x.map((s, k) => (s + y[k]) / 2)
  const MID = { u: mid(RO.u, DO.u), v: mid(RO.v, DO.v) }
  return { RO, MID, DO }
}

export function coreRange(a) {
  const { RO, DO } = corePoints(a)
  return { uLo: DO.u, uHi: RO.u, vLo: RO.v, vHi: DO.v }
}

export function isInCore(a, u, v, tol = 1e-9) {
  if ([...u, ...v].some((s) => s < -tol)) return false
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i].length; j++) {
      if (u[i] + v[j] < a[i][j] - tol) return false
    }
  }
  const total = [...u, ...v].reduce((s, x) => s + x, 0)
  return Math.abs(total - valueOf(a)) <= tol
}
