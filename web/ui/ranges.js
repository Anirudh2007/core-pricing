import { corePoints } from '../lib/core.js'
import { fmt } from './matrix.js'
import { pricesAt } from './market.js'

const SIDE = { R: { fill: '#dce7f8', ink: '#1d5bbf' }, D: { fill: '#f6e5d3', ink: '#a8520a' } }

function agents(p) {
  return [
    ...p.RO.u.map((_, i) => ({ name: `R${i + 1}`, side: 'R', RO: p.RO.u[i], MID: p.MID.u[i], DO: p.DO.u[i] })),
    ...p.RO.v.map((_, j) => ({ name: `D${j + 1}`, side: 'D', RO: p.RO.v[j], MID: p.MID.v[j], DO: p.DO.v[j] })),
  ]
}

export function renderRangeTable(root, a) {
  const p = corePoints(a)
  const rows = agents(p)
    .map((g) => `<tr><th scope="row" style="color:${SIDE[g.side].ink}">${g.name}</th><td>${fmt(g.RO)}</td><td>${fmt(g.MID)}</td><td>${fmt(g.DO)}</td><td>${fmt(Math.abs(g.RO - g.DO))}</td></tr>`)
    .join('')
  root.innerHTML = `<h3>Shares at each point</h3><div class="wrap"><table class="tbl">
    <thead><tr><th scope="col">Agent</th><th scope="col">RO</th><th scope="col">MID</th><th scope="col">DO</th><th scope="col">Width</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`
}

export function renderRanges(root, a, t) {
  const p = corePoints(a)
  const list = agents(p)
  const now = pricesAt(p, t)
  const at = [...now.u, ...now.v]
  const max = Math.max(1, ...list.flatMap((g) => [g.RO, g.DO]))

  if (!root.querySelector('.plot')) {
    root.innerHTML = `<h3>Range of each share</h3><figure><div class="plot"></div>
      <figcaption id="ranges-cap">Bars span the stable range of each agent’s share. Ticks mark RO, MID and DO; the dark marker is the price point chosen in the market above. The table lists the same numbers.</figcaption></figure>`
  }
  const plot = root.querySelector('.plot')
  const W = Math.max(plot.clientWidth, 280)
  const left = 40
  const right = 20
  const top = 28
  const rowH = 40
  const H = top + list.length * rowH + 28
  const x = (s) => left + (s / max) * (W - left - right)
  const step = max > 12 ? 5 : max > 5 ? 2 : 1

  let out = ''
  for (let s = 0; s <= max; s += step) {
    out += `<line class="grid" x1="${x(s)}" x2="${x(s)}" y1="${top - 6}" y2="${H - 24}"/><text x="${x(s)}" y="${H - 6}" text-anchor="middle">${s}</text>`
  }
  list.forEach((g, k) => {
    const y = top + k * rowH + rowH / 2
    const lo = Math.min(g.RO, g.DO)
    const hi = Math.max(g.RO, g.DO)
    const c = SIDE[g.side]
    out += `<text x="0" y="${y + 4}" font-weight="600" style="fill:${c.ink}">${g.name}</text>
      <rect x="${x(lo)}" y="${y - 7}" width="${Math.max(x(hi) - x(lo), 2)}" height="14" rx="4" fill="${c.fill}"/>`
    for (const r of ['RO', 'MID', 'DO']) {
      out += `<line x1="${x(g[r])}" x2="${x(g[r])}" y1="${y - 7}" y2="${y + 7}" stroke="${c.ink}" stroke-width="1.5"/>`
    }
    // name the three points once per side, where the first row leaves room above
    if (k === 0 || k === p.RO.u.length) {
      let last = -Infinity
      for (const r of ['RO', 'MID', 'DO'].sort((s, q) => g[s] - g[q])) {
        if (x(g[r]) - last < 30) continue
        out += `<text x="${x(g[r])}" y="${y - 12}" text-anchor="middle">${r}</text>`
        last = x(g[r])
      }
    }
    out += `<circle cx="${x(at[k])}" cy="${y}" r="6" fill="#111827" stroke="#fff" stroke-width="2"/>`
  })
  plot.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="ranges-cap">${out}</svg>`
}
