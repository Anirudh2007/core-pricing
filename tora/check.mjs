import { readFile } from 'node:fs/promises'
import { valueOf } from '../web/lib/assignment.js'
import { corePoints, isInCore } from '../web/lib/core.js'
import { worstCase } from '../web/lib/game.js'

const read = JSON.parse(await readFile(new URL('./results.json', import.meta.url), 'utf8'))
const mats = {
  A: [[10, 6], [7, 4]],
  B: [[12, 10, 6], [11, 7, 4], [9, 11, 9]],
}
const M = [[0, 2], [1, 1], [2, 0]]
let bad = 0

function line(name, got, ok, want) {
  if (got === null || got === undefined) return console.log(`pending   ${name}`)
  if (ok === undefined) return console.log(`recorded  ${name}: ${JSON.stringify(got)}`)
  if (!ok) bad++
  console.log(`${ok ? 'OK      ' : 'MISMATCH'}  ${name}: ${JSON.stringify(got)}${ok ? '' : `, expected ${want}`}`)
}

const near = (x, y) => Math.abs(x - y) < 1e-6
const sum = (xs) => xs.reduce((s, x) => s + x, 0)

for (const [name, a] of Object.entries(mats)) {
  const r = read[name]
  const V = valueOf(a)
  const p = corePoints(a)
  const n = a.length
  const K = Math.max(...a.flat())
  line(`${name} primal z`, r.primal.z, near(r.primal.z, V), V)
  line(`${name} primal iterations`, r.primal.iterations)
  const duals = r.primal.u && r.primal.v
  line(`${name} dual values (u, v) in the core`, duals ? [r.primal.u, r.primal.v] : null, duals && isInCore(a, r.primal.u, r.primal.v, 1e-6), 'a core point')
  line(`${name} RO z`, r.RO.z, near(r.RO.z, sum(p.RO.u)), sum(p.RO.u))
  line(`${name} DO z`, r.DO.z, near(r.DO.z, sum(p.DO.u)), sum(p.DO.u))
  for (const start of ['northwest', 'leastCost', 'vogel']) line(`${name} transport ${start} starting cost`, r.transport[start])
  line(`${name} transport optimal cost`, r.transport.optimal, near(r.transport.optimal, n * K - V), n * K - V)
}

const g = read.game
line('game w', g.w, near(g.w, 2), 2)
const mixOk = g.p && near(sum(g.p), 1) && near(worstCase(M, g.p, 'min'), 1)
line('game platform mix p is optimal', g.p, mixOk, 'a mix with worst case 1')

process.exit(bad ? 1 : 0)
