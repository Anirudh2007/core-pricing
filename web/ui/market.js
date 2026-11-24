import { bestMatching } from '../lib/assignment.js'
import { corePoints } from '../lib/core.js'
import { fmt, pairText } from './matrix.js'

const POINTS = [
  ['RO', 0, 'Rider-optimal'],
  ['MID', 0.5, 'Midpoint'],
  ['DO', 1, 'Driver-optimal'],
]

// Every mix of the two corners is again a core point, so one slider walks the whole core.
export const pricesAt = (p, t) => ({
  u: p.RO.u.map((x, i) => (1 - t) * x + t * p.DO.u[i]),
  v: p.RO.v.map((x, j) => (1 - t) * x + t * p.DO.v[j]),
})

function graph(W, a, pairs) {
  const m = a.length
  const n = a[0].length
  const rowH = 56
  const top = 36
  const most = Math.max(m, n)
  const H = top + most * rowH
  const xr = Math.min(120, W * 0.22)
  const xd = W - xr
  // the shorter column of nodes is centred against the longer one
  const at = (k, count) => top + rowH / 2 + k * rowH + ((most - count) * rowH) / 2
  const yr = (i) => at(i, m)
  const yd = (j) => at(j, n)
  const hit = new Set(pairs.map(([i, j]) => `${i},${j}`))

  let edges = ''
  let labels = ''
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (hit.has(`${i},${j}`)) continue
      edges += `<line x1="${xr}" y1="${yr(i)}" x2="${xd}" y2="${yd(j)}" stroke="rgba(17,24,39,0.12)" stroke-width="1"/>`
    }
  }
  for (const [i, j] of pairs) {
    edges += `<line x1="${xr}" y1="${yr(i)}" x2="${xd}" y2="${yd(j)}" stroke="#111827" stroke-width="2.5"/>`
    // a third of the way from the rider, so crossing edges keep their labels apart
    const mx = xr + (xd - xr) * 0.3
    const my = yr(i) + (yd(j) - yr(i)) * 0.3
    labels += `<text x="${mx}" y="${yd(j) < yr(i) ? my + 18 : my - 8}" text-anchor="middle" class="ink" font-weight="600" stroke="#fff" stroke-width="5" paint-order="stroke">${fmt(a[i][j])}</text>`
  }
  const node = (x, y, fill, name) =>
    `<circle cx="${x}" cy="${y}" r="16" fill="${fill}"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="#fff" style="fill:#fff" font-weight="600">${name}</text>`
  let nodes = ''
  for (let i = 0; i < m; i++) {
    nodes += node(xr, yr(i), '#1d5bbf', `R${i + 1}`)
    nodes += `<text class="share-u" data-k="${i}" x="${xr - 26}" y="${yr(i) + 5}" text-anchor="end" font-size="15" font-weight="600" style="fill:#1d5bbf"></text>`
  }
  for (let j = 0; j < n; j++) {
    nodes += node(xd, yd(j), '#a8520a', `D${j + 1}`)
    nodes += `<text class="share-v" data-k="${j}" x="${xd + 26}" y="${yd(j) + 5}" font-size="15" font-weight="600" style="fill:#a8520a"></text>`
  }
  const heads = `<text x="${xr}" y="14" text-anchor="middle">Riders keep</text><text x="${xd}" y="14" text-anchor="middle">Drivers keep</text>`
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="market-cap">${heads}${edges}${labels}${nodes}</svg>`
}

export function renderMarket(root, a, t, onPoint) {
  const { pairs } = bestMatching(a)
  const p = corePoints(a)
  const widest = Math.max(1e-9, ...pairs.map(([i, j]) => a[i][j]))

  const rows = pairs
    .map(([i, j]) => `<div>
      <div class="pair-top"><span class="who">${pairText([i, j])}</span><span class="of">surplus ${fmt(a[i][j])}</span></div>
      <div style="width:${(a[i][j] / widest) * 100}%"><div class="split" data-i="${i}" data-j="${j}"><span class="u"></span><span class="v"></span></div></div>
    </div>`)
    .join('')

  root.innerHTML = `<h3>Who rides with whom, and how they split it</h3>
    <figure><div class="plot"></div>
      <figcaption id="market-cap">Matched pairs are the dark lines, labelled with their surplus. Faint lines are pairs left unmatched. The numbers beside each rider and driver are their shares at the chosen price point.</figcaption></figure>
    <div class="pairs">${rows || '<p class="empty-state">No pair has positive surplus, so nobody is matched.</p>'}</div>
    <div class="point">
      <div class="point-top">
        <label for="point">Price point</label>
        <div class="seg" role="group" aria-label="Jump to a core point">
          ${POINTS.map(([k, t, name]) => `<button type="button" data-t="${t}" aria-label="${name}">${k}</button>`).join('')}
        </div>
      </div>
      <input id="point" type="range" min="0" max="100" step="1" aria-valuetext="">
      <div class="ends"><span>Rider-optimal</span><span>Midpoint</span><span>Driver-optimal</span></div>
      <div class="sums"><span class="ru">Riders’ total<b></b></span><span class="dv">Drivers’ total<b></b></span></div>
    </div>`

  const plot = root.querySelector('.plot')
  plot.innerHTML = graph(Math.max(plot.clientWidth, 280), a, pairs)
  const slider = root.querySelector('#point')

  const paint = (t) => {
    const { u, v } = pricesAt(p, t)
    root.querySelectorAll('.share-u').forEach((el) => (el.textContent = fmt(u[el.dataset.k])))
    root.querySelectorAll('.share-v').forEach((el) => (el.textContent = fmt(v[el.dataset.k])))
    root.querySelectorAll('.split').forEach((el) => {
      const [su, sv] = [u[el.dataset.i], v[el.dataset.j]]
      const [bu, bv] = el.children
      bu.style.flexGrow = su
      bv.style.flexGrow = sv
      bu.textContent = su > 0 ? fmt(su) : ''
      bv.textContent = sv > 0 ? fmt(sv) : ''
      bu.classList.toggle('empty', su <= 0)
      bv.classList.toggle('empty', sv <= 0)
    })
    const [tu, tv] = [u.reduce((s, x) => s + x, 0), v.reduce((s, x) => s + x, 0)]
    const [ru, dv] = root.querySelectorAll('.sums b')
    ru.textContent = fmt(tu)
    dv.textContent = fmt(tv)
    slider.value = Math.round(t * 100)
    const named = POINTS.find((q) => q[1] === t)
    slider.setAttribute('aria-valuetext', `${named ? named[2] : `${Math.round(t * 100)}% of the way to driver-optimal`}: riders ${fmt(tu)}, drivers ${fmt(tv)}`)
    root.querySelectorAll('[data-t]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.t === t)))
  }

  const set = (t) => {
    paint(t)
    onPoint(t)
  }
  slider.addEventListener('input', () => set(slider.value / 100))
  root.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => set(+b.dataset.t)))
  paint(t)
}
