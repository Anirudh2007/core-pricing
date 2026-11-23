import { manipulationTable, manipulationGain } from '../lib/manipulation.js'
import { fmt } from './matrix.js'

const RULES = ['RO', 'MID', 'DO']
const SHIFTS = [-2, -1, 1, 2]
const signed = (s) => (s > 0 ? `+${s}` : String(s))

function detail(a, rule, side) {
  const count = side === 'rider' ? a.length : a[0].length
  const tag = side === 'rider' ? 'R' : 'D'
  const hits = []
  for (let k = 0; k < count; k++) {
    for (const s of SHIFTS) {
      const g = manipulationGain(a, rule, side, k, s)
      if (g > 1e-9) hits.push({ who: `${tag}${k + 1}`, s, g })
    }
  }
  if (!hits.length) return `Under ${rule}, no ${side} gains from any of these misreports.`
  hits.sort((p, q) => q.g - p.g)
  const list = hits.map((h) => `${h.who} by ${signed(h.s)} gains ${fmt(h.g)}`).join('; ')
  return `Under ${rule}, the best ${side} misreport is ${hits[0].who} shifting by ${signed(hits[0].s)} (gain ${fmt(hits[0].g)}). All positive cases: ${list}.`
}

export function renderManipulation(root, a) {
  const table = manipulationTable(a, SHIFTS)
  const cases = SHIFTS.length * (a.length + a[0].length)
  const cell = (r, side) =>
    `<td><button type="button" class="cell-btn" data-rule="${r}" data-side="${side}" aria-pressed="false" aria-label="${r}, best ${side} gain ${fmt(table[r][side])}">${fmt(table[r][side])}</button></td>`
  const body = RULES.map((r) => `<tr><th scope="row">${r}</th>${cell(r, 'rider')}${cell(r, 'driver')}<td>${table[r].positive} of ${cases}</td></tr>`).join('')

  root.innerHTML = `<div class="wrap"><table>
      <thead><tr><th scope="col">Rule</th><th scope="col">Best rider gain</th><th scope="col">Best driver gain</th><th scope="col">Positive cases</th></tr></thead>
      <tbody>${body}</tbody></table></div>
    <p class="stat" id="manip-detail" aria-live="polite">Select a gain to see who misreports and by how much.</p>`

  const out = root.querySelector('#manip-detail')
  root.querySelectorAll('.cell-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.cell-btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)))
      out.textContent = detail(a, btn.dataset.rule, btn.dataset.side)
    })
  })
  return table
}
