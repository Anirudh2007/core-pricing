import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimate, noiseStudy } from '../web/lib/noise.js'
import { B, makeRng } from './helpers.js'

test('estimates are never negative', () => {
  const est = estimate([[0, 0], [0, 0]], 3, makeRng(1))
  assert.ok(est.flat().every((x) => x >= 0))
})

test('sigma 0 reproduces the truthful results exactly', () => {
  assert.deepEqual(estimate(B, 0, makeRng(1)), B)
  const [row] = noiseStudy(B, [0], 200, 1)
  assert.deepEqual(row, {
    sigma: 0,
    pChange: 0,
    meanLoss: 0,
    shift: { RO: 0, MID: 0, DO: 0 },
    pBlock: { RO: 0, MID: 0, DO: 0 },
  })
})

test('matching changes on B follow the targets', () => {
  const rows = noiseStudy(B, [0.25, 0.5, 1, 2], 4000, 1)
  const target = [0, 0.05, 0.3, 0.53]
  rows.forEach((r, k) => assert.ok(Math.abs(r.pChange - target[k]) <= 0.03, `sigma ${r.sigma}: ${r.pChange}`))
  for (let k = 1; k < rows.length; k++) {
    assert.ok(rows[k].meanLoss >= rows[k - 1].meanLoss)
    assert.ok(rows[k].shift.MID >= rows[k - 1].shift.MID)
  }
})

test('same seed gives identical results', () => {
  assert.deepEqual(noiseStudy(B, [1], 300, 9), noiseStudy(B, [1], 300, 9))
})
