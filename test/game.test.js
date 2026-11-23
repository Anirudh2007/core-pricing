import { test } from 'node:test'
import assert from 'node:assert/strict'
import { solveGame, worstCase, lines } from '../web/lib/game.js'

const close = (x, y) => assert.ok(Math.abs(x - y) < 1e-9, `${x} vs ${y}`)
const PLATFORM = [[0, 2], [1, 1], [2, 0]]

test('textbook game', () => {
  const g = solveGame([[3, -1], [-2, 4]], 'max')
  close(g.value, 1)
  assert.equal(g.saddle, false)
  g.rowMix.forEach((x, k) => close(x, [0.6, 0.4][k]))
  g.colMix.forEach((x, k) => close(x, [0.5, 0.5][k]))
})

test('platform game', () => {
  const g = solveGame(PLATFORM, 'min')
  close(g.value, 1)
  assert.equal(g.saddle, false)
  g.colMix.forEach((x) => close(x, 0.5))
  close(worstCase(PLATFORM, g.rowMix, 'min'), 1)
  close(worstCase(PLATFORM, [0, 1, 0], 'min'), 1)
  close(worstCase(PLATFORM, [0.5, 0, 0.5], 'min'), 1)
  close(worstCase(PLATFORM, [1, 0, 0], 'min'), 2)
})

test('pure saddle point is returned as pure', () => {
  assert.deepEqual(solveGame([[2, 3], [1, 4]], 'max'), { value: 2, rowMix: [1, 0], colMix: [1, 0], saddle: true })
})

test('two-row game uses the same method', () => {
  const g = solveGame([[3, -2], [-1, 4]], 'max')
  const h = solveGame([[3, -2, 5], [-1, 4, 6]], 'max')
  close(h.value, g.value)
  close(worstCase([[3, -2, 5], [-1, 4, 6]], h.rowMix, 'max'), h.value)
})

test('lines for the graphical method', () => {
  const { y, rows, envelope } = lines(PLATFORM, 0.25)
  assert.deepEqual(y, [0, 0.25, 0.5, 0.75, 1])
  assert.deepEqual(rows[0], [2, 1.5, 1, 0.5, 0])
  assert.deepEqual(rows[1], [1, 1, 1, 1, 1])
  assert.deepEqual(envelope, [0, 0.5, 1, 0.5, 0])
})

test('larger games without a saddle are out of scope', () => {
  assert.throws(() => solveGame([[0, 1, -1], [-1, 0, 1], [1, -1, 0]], 'max'), Error)
})
