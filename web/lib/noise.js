import { bestMatching } from './assignment.js'
import { corePoints } from './core.js'
import { makeRng, normal } from './rng.js'

const RULES = ['RO', 'MID', 'DO']

// a predicted surplus is the true one plus Gaussian error, floored at 0
export function estimate(a, sigma, rng) {
  return a.map((row) => row.map((x) => Math.max(x + sigma * normal(rng), 0)))
}

const l1 = (p, q) => [...p.u, ...p.v].reduce((s, x, k) => s + Math.abs(x - [...q.u, ...q.v][k]), 0)

function blocked(a, { u, v }) {
  return a.some((row, i) => row.some((x, j) => u[i] + v[j] < x - 1e-9))
}

export function noiseStudy(a, sigmas, draws, seed) {
  const truth = bestMatching(a)
  const truePoints = corePoints(a)
  const key = JSON.stringify(truth.pairs)

  return sigmas.map((sigma) => {
    const rng = makeRng(seed)
    let changed = 0
    let loss = 0
    const shift = { RO: 0, MID: 0, DO: 0 }
    const block = { RO: 0, MID: 0, DO: 0 }

    for (let d = 0; d < draws; d++) {
      const est = estimate(a, sigma, rng)
      const m = bestMatching(est)
      if (JSON.stringify(m.pairs) !== key) changed++
      loss += truth.value - m.pairs.reduce((s, [i, j]) => s + a[i][j], 0)
      const points = corePoints(est)
      for (const r of RULES) {
        shift[r] += l1(points[r], truePoints[r])
        if (blocked(a, points[r])) block[r]++
      }
    }

    const mean = (o) => Object.fromEntries(RULES.map((r) => [r, o[r] / draws]))
    return { sigma, pChange: changed / draws, meanLoss: loss / draws, shift: mean(shift), pBlock: mean(block) }
  })
}
