import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hungarianSteps } from '../web/lib/hungarian.js'
import { bestMatching } from '../web/lib/assignment.js'
import { B, makeRng, randomMatrix } from './helpers.js'

test('stages on B with K = 12', () => {
  const { stages, pairs } = hungarianSteps(B, 12)
  assert.deepEqual(stages, [
    { label: 'K minus a', matrix: [[0, 2, 6], [1, 5, 8], [3, 1, 3]] },
    { label: 'row-reduced', matrix: [[0, 2, 6], [0, 4, 7], [2, 0, 2]] },
    { label: 'column-reduced', matrix: [[0, 2, 4], [0, 4, 5], [2, 0, 0]] },
    { label: 'adjusted', matrix: [[0, 0, 2], [0, 2, 3], [4, 0, 0]] },
  ])
  assert.deepEqual(pairs, [[0, 1], [1, 0], [2, 2]])
})

test('K defaults to the largest entry', () => {
  assert.deepEqual(hungarianSteps(B).stages[0].matrix, [[0, 2, 6], [1, 5, 8], [3, 1, 3]])
})

test('agrees with brute force on 20 random 4x4 matrices', () => {
  const rng = makeRng(3)
  for (let t = 0; t < 20; t++) {
    const a = randomMatrix(rng, 4, 4).map((r) => r.map(Math.round))
    assert.deepEqual(hungarianSteps(a).pairs, bestMatching(a).pairs)
  }
})

test('square only', () => {
  assert.throws(() => hungarianSteps([[1, 2, 3], [4, 5, 6]]), Error)
})

test('decimal entries still reach an assignment', () => {
  const a = [[1.1, 2.3, 0.7], [0.4, 1.9, 2.2], [3.3, 0.1, 1.6]]
  assert.deepEqual(hungarianSteps(a).pairs, bestMatching(a).pairs)
})
