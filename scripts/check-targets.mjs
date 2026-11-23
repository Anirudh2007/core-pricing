import { bestMatching, valueOf } from '../web/lib/assignment.js'
import { corePoints, isInCore } from '../web/lib/core.js'
import { hungarianSteps } from '../web/lib/hungarian.js'
import { noiseStudy } from '../web/lib/noise.js'
import { manipulationTable, manipulationGain } from '../web/lib/manipulation.js'
import { solveGame, worstCase } from '../web/lib/game.js'
import { makeRng } from '../web/lib/rng.js'

const A = [[10, 6], [7, 4]]
const B = [[12, 10, 6], [11, 7, 4], [9, 11, 9]]
const RULES = ['RO', 'MID', 'DO']
let missed = 0

const same = (x, y) => JSON.stringify(x) === JSON.stringify(y)
function expect(name, ok) {
  if (!ok) missed++
  console.log(`${ok ? 'ok  ' : 'MISS'} ${name}`)
}
const fmt = (xs) => `(${xs.map((x) => +x.toFixed(3)).join(', ')})`
const pad = (s, w) => String(s).padEnd(w)

function pricing(name, a) {
  const { value, pairs } = bestMatching(a)
  const p = corePoints(a)
  console.log(`\n${name}: V = ${value}, matching ${pairs.map(([i, j]) => `R${i + 1}-D${j + 1}`).join(', ')}`)
  console.log(`${pad('rule', 5)} ${pad('u (riders)', 18)} ${pad('v (drivers)', 18)} sum u`)
  for (const r of RULES) {
    const sumU = p[r].u.reduce((s, x) => s + x, 0)
    console.log(`${pad(r, 5)} ${pad(fmt(p[r].u), 18)} ${pad(fmt(p[r].v), 18)} ${sumU}`)
  }
  return { value, pairs, p }
}

console.log('1. Pricing')
const a = pricing('Instance A', A)
expect('A value and matching', a.value === 14 && same(a.pairs, [[0, 0], [1, 1]]))
expect('A RO', same(a.p.RO, { u: [7, 4], v: [3, 0] }))
expect('A MID', same(a.p.MID, { u: [4.5, 2], v: [5.5, 2] }))
expect('A DO', same(a.p.DO, { u: [2, 0], v: [8, 4] }))

const b = pricing('Instance B', B)
expect('B value and matching', b.value === 30 && same(b.pairs, [[0, 1], [1, 0], [2, 2]]))
expect('B RO', same(b.p.RO, { u: [8, 7, 9], v: [4, 2, 0] }))
expect('B MID', same(b.p.MID, { u: [4.5, 3.5, 5.5], v: [7.5, 5.5, 3.5] }))
expect('B DO', same(b.p.DO, { u: [1, 0, 2], v: [11, 9, 7] }))
const widths = [...b.p.RO.u.map((x, i) => x - b.p.DO.u[i]), ...b.p.DO.v.map((x, j) => x - b.p.RO.v[j])]
expect('B every range has width 7', widths.every((w) => w === 7))
for (const r of RULES) expect(`B ${r} is in the core`, isInCore(B, b.p[r].u, b.p[r].v))

const others = []
for (const perm of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) {
  others.push(perm.reduce((s, j, i) => s + B[i][j], 0))
}
others.sort((x, y) => y - x)
console.log(`B values of all six matchings: ${others.join(', ')}`)
expect('B other matching values', same(others.slice(1), [28, 28, 27, 23, 22]))

const noD3 = [[12, 10], [11, 7], [9, 11]]
const c = pricing('B without D3', noD3)
expect('B without D3', c.value === 23 && same(c.pairs, [[0, 0], [2, 1]]) && c.p.RO.u[1] === 0)
const rect = pricing('Rectangular', [[5, 3], [4, 2], [1, 1]])
expect('rectangular', rect.value === 7 && same(rect.p.RO, { u: [2, 1, 0], v: [3, 1] }) && same(rect.p.DO, { u: [1, 0, 0], v: [4, 2] }))
const ones = pricing('All ones', [[1, 1], [1, 1]])
expect('all ones', ones.value === 2 && same(ones.p.RO, { u: [1, 1], v: [0, 0] }) && same(ones.p.DO, { u: [0, 0], v: [1, 1] }))

console.log('\n2. Hungarian method on B (K = 12)')
const h = hungarianSteps(B, 12)
for (const s of h.stages) console.log(`${pad(s.label, 15)} ${JSON.stringify(s.matrix)}`)
expect('Hungarian final stage', same(h.stages.at(-1).matrix, [[0, 0, 2], [0, 2, 3], [4, 0, 0]]))
expect('Hungarian pairs', same(h.pairs, b.pairs))

console.log('\n3. Noise on B (4000 draws, seed 1)')
const sigmas = [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3]
const rows = noiseStudy(B, sigmas, 4000, 1)
console.log(`${pad('sigma', 6)} ${pad('pChange', 8)} ${pad('loss', 7)} ${pad('shift RO', 9)} ${pad('MID', 7)} ${pad('DO', 7)} ${pad('pBlock RO', 10)} ${pad('MID', 6)} DO`)
for (const r of rows) {
  const f = (x) => x.toFixed(3)
  console.log(`${pad(r.sigma, 6)} ${pad(f(r.pChange), 8)} ${pad(f(r.meanLoss), 7)} ${pad(f(r.shift.RO), 9)} ${pad(f(r.shift.MID), 7)} ${pad(f(r.shift.DO), 7)} ${pad(f(r.pBlock.RO), 10)} ${pad(f(r.pBlock.MID), 6)} ${f(r.pBlock.DO)}`)
}
const target = { 0.25: 0, 0.5: 0.05, 1: 0.3, 2: 0.53 }
for (const r of rows) {
  if (r.sigma in target) expect(`pChange at sigma ${r.sigma}`, Math.abs(r.pChange - target[r.sigma]) <= 0.03)
}
expect('sigma 0 changes nothing', rows[0].pChange === 0 && rows[0].meanLoss === 0 && RULES.every((r) => rows[0].shift[r] === 0))

console.log('\n4. Manipulation on B (shifts -2, -1, 1, 2)')
const table = manipulationTable(B)
console.log(`${pad('rule', 5)} ${pad('best rider gain', 16)} ${pad('best driver gain', 17)} positive cases`)
for (const r of RULES) console.log(`${pad(r, 5)} ${pad(table[r].rider, 16)} ${pad(table[r].driver, 17)} ${table[r].positive} of 24`)
expect('manipulation table', same(table, {
  RO: { rider: 0, driver: 2, positive: 2 },
  MID: { rider: 1, driver: 1, positive: 5 },
  DO: { rider: 2, driver: 0, positive: 3 },
}))

const rng = makeRng(1)
let rider = -Infinity
let driver = -Infinity
for (let t = 0; t < 200; t++) {
  const m = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 1 + 19 * rng()))
  for (let k = 0; k < 4; k++) {
    for (const s of [-2, -1, -0.5, 0.5, 1, 2]) {
      if (m[k].every((x) => x + s > 0)) rider = Math.max(rider, manipulationGain(m, 'RO', 'rider', k, s))
      if (m.every((row) => row[k] + s > 0)) driver = Math.max(driver, manipulationGain(m, 'DO', 'driver', k, s))
    }
  }
}
console.log(`200 random 4x4: largest rider gain under RO ${rider.toExponential(2)}, largest driver gain under DO ${driver.toExponential(2)}`)
expect('RO truthful for riders, DO for drivers', rider <= 1e-7 && driver <= 1e-7)

console.log('\n5. Pricing game (platform minimises the best gain)')
const M = RULES.map((r) => [table[r].rider, table[r].driver])
console.log(`M = ${JSON.stringify(M)}`)
const g = solveGame(M, 'min')
const rowMax = Math.min(...M.map((r) => Math.max(...r)))
const colMin = Math.max(...[0, 1].map((j) => Math.min(...M.map((r) => r[j]))))
console.log(`smallest row maximum ${rowMax}, largest column minimum ${colMin}, saddle ${g.saddle}`)
console.log(`value ${g.value}, platform ${fmt(g.rowMix)}, manipulator ${fmt(g.colMix)}`)
console.log(`worst case of pure MID ${worstCase(M, [0, 1, 0], 'min')}, of half RO half DO ${worstCase(M, [0.5, 0, 0.5], 'min')}`)
expect('game value 1, no saddle', g.value === 1 && !g.saddle && rowMax === 1 && colMin === 0)
expect('MID and RO/DO mix are optimal', worstCase(M, [0, 1, 0], 'min') === 1 && worstCase(M, [0.5, 0, 0.5], 'min') === 1)
const t = solveGame([[3, -1], [-2, 4]], 'max')
console.log(`textbook [[3,-1],[-2,4]]: value ${t.value}, rows ${fmt(t.rowMix)}, columns ${fmt(t.colMix)}`)
expect('textbook game', Math.abs(t.value - 1) < 1e-9 && Math.abs(t.rowMix[0] - 0.6) < 1e-9)

console.log(`\n${missed ? `${missed} target(s) missed` : 'all targets met'}`)
process.exit(missed ? 1 : 0)
