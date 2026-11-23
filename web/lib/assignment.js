const MAX = 4

export function checkMatrix(a) {
  if (!Array.isArray(a)) throw new Error('matrix must be an array of rows')
  if (a.length > MAX) throw new Error(`at most ${MAX} riders`)
  const n = a.length ? a[0].length : 0
  if (n > MAX) throw new Error(`at most ${MAX} drivers`)
  for (const row of a) {
    if (!Array.isArray(row) || row.length !== n) throw new Error('rows must have equal length')
    for (const x of row) {
      if (!Number.isFinite(x) || x < 0) throw new Error('surplus must be a number >= 0')
    }
  }
}

// Every partial matching is tried, rows in order, each row taking a free
// column or staying unmatched (that option last). The first strict maximum
// wins, which gives the lexicographic tie rule.
export function bestMatching(a) {
  checkMatrix(a)
  const n = a.length ? a[0].length : 0
  const used = Array(n).fill(false)
  const pick = []
  let best = { value: -1, pairs: [] }

  const walk = (i, total) => {
    if (i === a.length) {
      if (total > best.value) best = { value: total, pairs: pick.filter((p) => p[1] >= 0).map((p) => [...p]) }
      return
    }
    for (let j = 0; j < n; j++) {
      if (used[j]) continue
      used[j] = true
      pick.push([i, j])
      walk(i + 1, total + a[i][j])
      pick.pop()
      used[j] = false
    }
    pick.push([i, -1])
    walk(i + 1, total)
    pick.pop()
  }

  walk(0, 0)
  return best
}

export function valueOf(a) {
  return bestMatching(a).value
}

export const dropRow = (a, i) => a.filter((_, k) => k !== i)
export const dropCol = (a, j) => a.map((row) => row.filter((_, k) => k !== j))
