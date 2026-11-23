import { test } from 'node:test'
import assert from 'node:assert/strict'
import { corePoints, coreRange, isInCore } from '../web/lib/core.js'
import { A, B, makeRng, randomMatrix } from './helpers.js'

const sum = (xs) => xs.reduce((s, x) => s + x, 0)

test('core points of A', () => {
  const p = corePoints(A)
  assert.deepEqual(p.RO, { u: [7, 4], v: [3, 0] })
  assert.deepEqual(p.MID, { u: [4.5, 2], v: [5.5, 2] })
  assert.deepEqual(p.DO, { u: [2, 0], v: [8, 4] })
  assert.equal(sum(p.RO.u), 11)
  assert.equal(sum(p.DO.u), 2)
})

test('core points of B', () => {
  const p = corePoints(B)
  assert.deepEqual(p.RO, { u: [8, 7, 9], v: [4, 2, 0] })
  assert.deepEqual(p.MID, { u: [4.5, 3.5, 5.5], v: [7.5, 5.5, 3.5] })
  assert.deepEqual(p.DO, { u: [1, 0, 2], v: [11, 9, 7] })
  assert.equal(sum(p.RO.u), 24)
  assert.equal(sum(p.DO.u), 3)
})

test('every range of B has width 7', () => {
  const r = coreRange(B)
  for (let i = 0; i < 3; i++) {
    assert.equal(r.uHi[i] - r.uLo[i], 7)
    assert.equal(r.vHi[i] - r.vLo[i], 7)
  }
})

test('B without D3: unmatched rider gets 0', () => {
  const a = [[12, 10], [11, 7], [9, 11]]
  const p = corePoints(a)
  for (const r of ['RO', 'MID', 'DO']) {
    assert.equal(p[r].u[1], 0)
    assert.ok(isInCore(a, p[r].u, p[r].v))
  }
})

test('rectangular instance', () => {
  const p = corePoints([[5, 3], [4, 2], [1, 1]])
  assert.deepEqual(p.RO, { u: [2, 1, 0], v: [3, 1] })
  assert.deepEqual(p.DO, { u: [1, 0, 0], v: [4, 2] })
})

test('all-ones ties', () => {
  const p = corePoints([[1, 1], [1, 1]])
  assert.deepEqual(p.RO, { u: [1, 1], v: [0, 0] })
  assert.deepEqual(p.DO, { u: [0, 0], v: [1, 1] })
})

test('isInCore rejects a blocking pair and a wrong total', () => {
  assert.ok(isInCore(A, [7, 4], [3, 0]))
  assert.ok(!isInCore(A, [7, 3], [3, 1]))
  assert.ok(!isInCore(A, [7, 4], [3, 1]))
  assert.ok(!isInCore(A, [-1, 4], [11, 0]))
})

test('points and mixes of 200 random 3x3 matrices lie in the core', () => {
  const rng = makeRng(7)
  for (let t = 0; t < 200; t++) {
    const a = randomMatrix(rng, 3, 3)
    const p = corePoints(a)
    for (const r of ['RO', 'MID', 'DO']) assert.ok(isInCore(a, p[r].u, p[r].v, 1e-7))
    const w = rng()
    const u = p.RO.u.map((x, i) => w * x + (1 - w) * p.DO.u[i])
    const v = p.RO.v.map((x, j) => w * x + (1 - w) * p.DO.v[j])
    assert.ok(isInCore(a, u, v, 1e-7))
  }
})

test('bad input throws', () => {
  assert.throws(() => corePoints([[1, -1]]), Error)
  assert.throws(() => corePoints([[1, 2], [3]]), Error)
})
