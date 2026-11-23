import { checkMatrix } from './assignment.js'

const copy = (c) => c.map((row) => [...row])
const bit = (mask, k) => (mask >> k) & 1
// decimal input leaves round-off like 1e-15 where the method needs an exact zero
const snap = (x) => (Math.abs(x) < 1e-9 ? 0 : x)

// Fewest rows and columns that cover every zero (brute force, n <= 4).
function cover(c) {
  const n = c.length
  let best = null
  for (let mask = 0; mask < 1 << (2 * n); mask++) {
    let ok = true
    for (let i = 0; i < n && ok; i++) {
      for (let j = 0; j < n && ok; j++) {
        if (c[i][j] === 0 && !bit(mask, i) && !bit(mask, n + j)) ok = false
      }
    }
    let lines = 0
    for (let k = 0; k < 2 * n; k++) lines += bit(mask, k)
    if (ok && (!best || lines < best.lines)) best = { lines, mask }
  }
  const rows = Array.from({ length: n }, (_, i) => bit(best.mask, i) === 1)
  const cols = Array.from({ length: n }, (_, j) => bit(best.mask, n + j) === 1)
  return { lines: best.lines, rows, cols }
}

// First permutation (lexicographic) that uses only zero cells.
function zeroAssignment(c) {
  const n = c.length
  const used = Array(n).fill(false)
  const pick = []
  const walk = (i) => {
    if (i === n) return true
    for (let j = 0; j < n; j++) {
      if (used[j] || c[i][j] !== 0) continue
      used[j] = true
      pick.push([i, j])
      if (walk(i + 1)) return true
      pick.pop()
      used[j] = false
    }
    return false
  }
  walk(0)
  return pick
}

export function hungarianSteps(a, K = Math.max(...a.flat())) {
  checkMatrix(a)
  const n = a.length
  if (a.some((row) => row.length !== n)) throw new Error('the Hungarian method needs a square matrix')

  // maximising a is the same as minimising K - a
  let c = a.map((row) => row.map((x) => K - x))
  const stages = [{ label: 'K minus a', matrix: copy(c) }]

  c = c.map((row) => row.map((x) => snap(x - Math.min(...row))))
  stages.push({ label: 'row-reduced', matrix: copy(c) })

  for (let j = 0; j < n; j++) {
    const low = Math.min(...c.map((row) => row[j]))
    for (let i = 0; i < n; i++) c[i][j] = snap(c[i][j] - low)
  }
  stages.push({ label: 'column-reduced', matrix: copy(c) })

  for (let { lines, rows, cols } = cover(c); lines < n; { lines, rows, cols } = cover(c)) {
    let low = Infinity
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) if (!rows[i] && !cols[j]) low = Math.min(low, c[i][j])
    }
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!rows[i] && !cols[j]) c[i][j] = snap(c[i][j] - low)
        if (rows[i] && cols[j]) c[i][j] += low
      }
    }
    stages.push({ label: 'adjusted', matrix: copy(c) })
  }

  return { stages, pairs: zeroAssignment(c) }
}
