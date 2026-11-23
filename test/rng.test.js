import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeRng, normal } from '../web/lib/rng.js'

test('same seed, same stream', () => {
  const a = makeRng(42)
  const b = makeRng(42)
  for (let k = 0; k < 100; k++) assert.equal(a(), b())
})

test('uniform draws lie in [0, 1)', () => {
  const r = makeRng(1)
  for (let k = 0; k < 10000; k++) {
    const x = r()
    assert.ok(x >= 0 && x < 1)
  }
})

test('normal draws have mean near 0 and variance near 1', () => {
  const r = makeRng(5)
  const xs = Array.from({ length: 20000 }, () => normal(r))
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length
  const varc = xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length
  assert.ok(Math.abs(mean) < 0.03)
  assert.ok(Math.abs(varc - 1) < 0.05)
})
