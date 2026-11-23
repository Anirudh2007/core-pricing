import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bestMatching, valueOf } from '../web/lib/assignment.js'
import { A, B } from './helpers.js'

test('instance A', () => {
  assert.deepEqual(bestMatching(A), { value: 14, pairs: [[0, 0], [1, 1]] })
})

test('instance B', () => {
  assert.deepEqual(bestMatching(B), { value: 30, pairs: [[0, 1], [1, 0], [2, 2]] })
})

test('B without driver D3 leaves rider R2 unmatched', () => {
  const m = bestMatching([[12, 10], [11, 7], [9, 11]])
  assert.equal(m.value, 23)
  assert.deepEqual(m.pairs, [[0, 0], [2, 1]])
})

test('rectangular and all-ones values', () => {
  assert.equal(valueOf([[5, 3], [4, 2], [1, 1]]), 7)
  assert.equal(valueOf([[1, 1], [1, 1]]), 2)
  assert.deepEqual(bestMatching([[1, 1], [1, 1]]).pairs, [[0, 0], [1, 1]])
})

test('empty matrix has value 0', () => {
  assert.equal(valueOf([]), 0)
  assert.equal(valueOf([[], []]), 0)
})

test('bad input throws', () => {
  assert.throws(() => valueOf([[1, -2], [3, 4]]), Error)
  assert.throws(() => valueOf([[1, 2], [3]]), Error)
  assert.throws(() => valueOf([[1, 2, 3, 4, 5]]), Error)
  assert.throws(() => valueOf([[1], [2], [3], [4], [5]]), Error)
  assert.throws(() => valueOf([[1, NaN]]), Error)
})
