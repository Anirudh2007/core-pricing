import { manipulationTable, manipulationGain } from '../lib/manipulation.js'
import { fmt } from './matrix.js'

const RULES = ['RO', 'MID', 'DO']
const SHIFTS = [-2, -1, 1, 2]
const NAMES = { RO: 'rider-optimal', MID: 'midpoint', DO: 'driver-optimal' }
const signed = (s) => (s > 0 ? `+${s}` : `−${-s}`)

function cases(a, rule, side) {
  const count = side === 'rider' ? a.length : a[0].length
  const tag = side === 'rider' ? 'R' : 'D'
  const hits = []
  for (let k = 0; k < count; k++) {
    for (const s of SHIFTS) {
      const g = manipulationGain(a, rule, side, k, s)
      if (g > 1e-9) hits.push({ who: `${tag}${k + 1}`, s, g })
    }
  }
  return hits.sort((p, q) => q.g - p.g)
}

function detail(a, rule, side, top) {
  const hits = cases(a, rule, side)
  const head = `<h3>${side === 'rider' ? 'Riders' : 'Drivers'} under ${NAMES[rule]} prices</h3>`
  if (!hits.length) {
    return `${head}<p class="empty-state">No ${side} gains from any of the ${SHIFTS.length} misreports. Telling the truth is their best reply here.</p>`
  }
  const list = hits
    .map((h) => `<li><span>${h.who} reports ${signed(h.s)}</span><span class="bar"><i style="width:${(h.g / top) * 100}%"></i></span><span class="g">${fmt(h.g)}</span></li>`)
    .join('')
  const under = hits.every((h) => h.s < 0) ? ' Every one of them understates the surplus.' : ''
  return `${head}<ul class="ranked" aria-label="Misreports with a positive gain, largest first">${list}</ul>
    <p class="note">${hits.length} misreport${hits.length > 1 ? 's' : ''} pay off.${under}</p>`
}

export function renderManipulation(root, a) {
  const table = manipulationTable(a, SHIFTS)
  const total = SHIFTS.length * (a.length + a[0].length)
  const top = Math.max(1e-9, ...RULES.flatMap((r) => [table[r].rider, table[r].driver]))
  let pick = ['RO', 'driver']
  for (const r of RULES) {
    for (const side of ['rider', 'driver']) if (table[r][side] > table[pick[0]][pick[1]]) pick = [r, side]
  }

  const cell = (r, side) =>
    `<td><button type="button" class="cellbtn" data-rule="${r}" data-side="${side}" aria-label="${r}, best ${side} gain ${fmt(table[r][side])}">${fmt(table[r][side])}</button></td>`
  const body = RULES.map((r) => `<tr><th scope="row">${r}</th>${cell(r, 'rider')}${cell(r, 'driver')}<td>${table[r].positive} of ${total}</td></tr>`).join('')

  root.innerHTML = `<div class="card span-5"><h3>Best gain from one misreport</h3><div class="wrap"><table class="tbl">
      <thead><tr><th scope="col">Rule</th><th scope="col">Rider</th><th scope="col">Driver</th><th scope="col">Cases that pay</th></tr></thead>
      <tbody>${body}</tbody></table></div>
      <p class="note">RO pays every rider their marginal contribution, so no rider can gain under it; DO does the same for drivers.</p></div>
    <div class="card span-7" id="manip-detail" aria-live="polite"></div>`

  const out = root.querySelector('#manip-detail')
  const show = (rule, side) => {
    root.querySelectorAll('.cellbtn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rule === rule && b.dataset.side === side)))
    out.innerHTML = detail(a, rule, side, top)
  }
  root.querySelectorAll('.cellbtn').forEach((b) => b.addEventListener('click', () => show(b.dataset.rule, b.dataset.side)))
  show(...pick)
  return table
}
