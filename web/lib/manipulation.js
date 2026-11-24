import { bestMatching } from './assignment.js'
import { corePoints, RULES } from './core.js'

const owner = (side, i, j) => (side === 'rider' ? i : j)

// What agent k really earns when the platform prices the reported matrix:
// true surplus with the partner minus the partner's share.
function payoff(truth, reported, rule, side, k) {
  const { pairs } = bestMatching(reported)
  const { u, v } = corePoints(reported)[rule]
  const pair = pairs.find(([i, j]) => owner(side, i, j) === k)
  if (!pair) return 0
  const [i, j] = pair
  return side === 'rider' ? truth[i][j] - v[j] : truth[i][j] - u[i]
}

export function manipulationGain(a, rule, side, k, shift) {
  // a reported surplus cannot go below 0
  const reported = a.map((row, i) =>
    row.map((x, j) => (owner(side, i, j) === k ? Math.max(x + shift, 0) : x))
  )
  return payoff(a, reported, rule, side, k) - payoff(a, a, rule, side, k)
}

export function manipulationTable(a, shifts = [-2, -1, 1, 2]) {
  const counts = { rider: a.length, driver: a.length ? a[0].length : 0 }
  const table = {}
  for (const rule of RULES) {
    // reporting the truth is always allowed, so the best gain is at least 0
    const row = { rider: 0, driver: 0, positive: 0 }
    for (const side of ['rider', 'driver']) {
      for (let k = 0; k < counts[side]; k++) {
        for (const s of shifts) {
          const g = manipulationGain(a, rule, side, k, s)
          if (g > 1e-9) row.positive++
          row[side] = Math.max(row[side], g)
        }
      }
    }
    table[rule] = row
  }
  return table
}
