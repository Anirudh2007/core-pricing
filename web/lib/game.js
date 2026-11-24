const EPS = 1e-9
const oneHot = (n, k) => Array.from({ length: n }, (_, i) => (i === k ? 1 : 0))
const transpose = (M) => M[0].map((_, j) => M.map((row) => row[j]))

// Graphical method for a game where the row player maximises and the column
// player has two strategies. The column player mixes (y, 1 - y); each row is
// then a line in y, and y is chosen to minimise their upper envelope. The
// optimum lies at 0, 1 or a crossing of two lines.
function twoColumns(N) {
  const slope = N.map(([p, q]) => p - q)
  const at = (i, y) => N[i][1] + slope[i] * y
  const top = (y) => Math.max(...N.map((_, i) => at(i, y)))

  const ys = [0, 1]
  for (let i = 0; i < N.length; i++) {
    for (let k = i + 1; k < N.length; k++) {
      if (slope[i] === slope[k]) continue
      const y = (N[k][1] - N[i][1]) / (slope[i] - slope[k])
      if (y > 0 && y < 1) ys.push(y)
    }
  }
  const y = ys.reduce((b, c) => (top(c) < top(b) - EPS ? c : b))
  const value = top(y)

  // Mixing the steepest rising and steepest falling active rows so that the
  // slopes cancel gives a flat line at the value: an optimal row strategy.
  const active = N.map((_, i) => i).filter((i) => Math.abs(at(i, y) - value) < EPS)
  const up = active.reduce((b, i) => (slope[i] > slope[b] ? i : b))
  const down = active.reduce((b, i) => (slope[i] < slope[b] ? i : b))
  const x = up === down ? 1 : Math.min(1, Math.max(0, -slope[down] / (slope[up] - slope[down])))
  const rowMix = Array(N.length).fill(0)
  rowMix[up] += x
  rowMix[down] += 1 - x
  return { value, rowMix, colMix: [y, 1 - y], saddle: false }
}

function solveMax(N) {
  const rowMin = N.map((row) => Math.min(...row))
  const colMax = transpose(N).map((col) => Math.max(...col))
  const lower = Math.max(...rowMin)
  const upper = Math.min(...colMax)
  if (Math.abs(lower - upper) < EPS) {
    return {
      value: lower,
      rowMix: oneHot(N.length, rowMin.indexOf(lower)),
      colMix: oneHot(N[0].length, colMax.indexOf(upper)),
      saddle: true,
    }
  }
  if (N[0].length === 2) return twoColumns(N)
  if (N.length === 2) {
    // swap roles: the column player maximises -N transposed
    const g = twoColumns(transpose(N).map((row) => row.map((x) => -x)))
    return { value: -g.value, rowMix: g.colMix, colMix: g.rowMix, saddle: false }
  }
  throw new Error('only games with a saddle point or with two rows or two columns are handled')
}

export function solveGame(M, rowGoal) {
  const sign = rowGoal === 'max' ? 1 : -1
  const g = solveMax(M.map((row) => row.map((x) => sign * x)))
  // adding 0 turns a -0 from the sign flip into 0
  return { ...g, value: sign * g.value + 0 }
}

export function worstCase(M, rowMix, rowGoal) {
  const pay = transpose(M).map((col) => col.reduce((s, x, i) => s + x * rowMix[i], 0))
  return rowGoal === 'max' ? Math.min(...pay) : Math.max(...pay)
}

// Rows of M are the platform's choices (it minimises); y is the chance the
// manipulator plays column 0. The platform answers on the lower envelope.
export function lines(M, step = 0.01) {
  const count = Math.round(1 / step)
  const y = Array.from({ length: count + 1 }, (_, k) => Math.round(k * step * 1e9) / 1e9)
  const rows = M.map(([p, q]) => y.map((t) => p * t + q * (1 - t)))
  const envelope = y.map((_, k) => Math.min(...rows.map((r) => r[k])))
  return { y, rows, envelope }
}
