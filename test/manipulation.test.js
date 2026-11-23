import { test } from 'node:test'
import assert from 'node:assert/strict'
import { manipulationGain, manipulationTable } from '../web/lib/manipulation.js'
import { B, makeRng, randomMatrix } from './helpers.js'

test('table for B', () => {
  assert.deepEqual(manipulationTable(B), {
    RO: { rider: 0, driver: 2, positive: 2 },
    MID: { rider: 1, driver: 1, positive: 5 },
    DO: { rider: 2, driver: 0, positive: 3 },
  })
})

test('a zero shift gains nothing', () => {
  for (const rule of ['RO', 'MID', 'DO']) {
    assert.equal(manipulationGain(B, rule, 'rider', 0, 0), 0)
    assert.equal(manipulationGain(B, rule, 'driver', 2, 0), 0)
  }
})

test('RO is truthful for riders and DO for drivers on 200 random 4x4 matrices', () => {
  const rng = makeRng(1)
  const shifts = [-2, -1, -0.5, 0.5, 1, 2]
  let worstRider = -Infinity
  let worstDriver = -Infinity
  for (let t = 0; t < 200; t++) {
    const a = randomMatrix(rng, 4, 4, 1, 20)
    for (let k = 0; k < 4; k++) {
      for (const s of shifts) {
        if (a[k].some((x) => x + s <= 0)) continue
        worstRider = Math.max(worstRider, manipulationGain(a, 'RO', 'rider', k, s))
      }
      for (const s of shifts) {
        if (a.some((row) => row[k] + s <= 0)) continue
        worstDriver = Math.max(worstDriver, manipulationGain(a, 'DO', 'driver', k, s))
      }
    }
  }
  assert.ok(worstRider <= 1e-7, `rider gain ${worstRider}`)
  assert.ok(worstDriver <= 1e-7, `driver gain ${worstDriver}`)
})
