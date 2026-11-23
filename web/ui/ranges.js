import { corePoints } from '../lib/core.js'
import { fmt } from './matrix.js'

export function renderRanges(root, a) {
  const p = corePoints(a)
  const agents = [
    ...p.RO.u.map((_, i) => ({ name: `R${i + 1}`, RO: p.RO.u[i], MID: p.MID.u[i], DO: p.DO.u[i] })),
    ...p.RO.v.map((_, j) => ({ name: `D${j + 1}`, RO: p.RO.v[j], MID: p.MID.v[j], DO: p.DO.v[j] })),
  ]
  const rows = agents
    .map((g) => `<tr><th scope="row">${g.name}</th><td>${fmt(g.RO)}</td><td>${fmt(g.MID)}</td><td>${fmt(g.DO)}</td><td>${fmt(Math.abs(g.RO - g.DO))}</td></tr>`)
    .join('')
  const total = (u) => fmt(u.reduce((s, v) => s + v, 0))

  root.innerHTML = `<div class="split">
    <figure>
      <div class="plot"></div>
      <figcaption id="ranges-cap">Core range of each agent's share, riders R and drivers D. The table lists the same numbers.</figcaption>
    </figure>
    <div class="wrap"><table>
      <thead><tr><th scope="col">Agent</th><th scope="col">RO</th><th scope="col">MID</th><th scope="col">DO</th><th scope="col">Width</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="stat">Riders' total: RO <strong>${total(p.RO.u)}</strong>, DO <strong>${total(p.DO.u)}</strong>.</p>
    </div></div>`

  const plot = root.querySelector('.plot')
  const max = Math.max(1, ...agents.flatMap((g) => [g.RO, g.DO]))
  const W = Math.max(plot.clientWidth, 260)
  const left = 36
  const right = 16
  const top = 30
  const rowH = 38
  const H = top + agents.length * rowH + 24
  const x = (s) => left + (s / max) * (W - left - right)

  const step = max > 12 ? 5 : max > 5 ? 2 : 1
  let grid = ''
  for (let s = 0; s <= max; s += step) {
    grid += `<line class="grid" x1="${x(s)}" x2="${x(s)}" y1="${top - 8}" y2="${H - 22}"/>
      <text class="muted" x="${x(s)}" y="${H - 6}" text-anchor="middle">${s}</text>`
  }

  // label the three points on the first rider and first driver row only
  const firstOfSide = (k) => k === 0 || k === p.RO.u.length
  const bars = agents
    .map((g, k) => {
      const y = top + k * rowH + rowH / 2
      const lo = Math.min(g.RO, g.DO)
      const hi = Math.max(g.RO, g.DO)
      let marks = ''
      let lastX = -Infinity
      for (const r of ['RO', 'MID', 'DO'].sort((s, t) => g[s] - g[t])) {
        marks += `<line class="tick" x1="${x(g[r])}" x2="${x(g[r])}" y1="${y - 9}" y2="${y + 9}"/>`
        if (firstOfSide(k) && x(g[r]) - lastX > 30) {
          marks += `<text x="${x(g[r])}" y="${y - 13}" text-anchor="middle">${r}</text>`
          lastX = x(g[r])
        }
      }
      return `<text x="0" y="${y + 4}">${g.name}</text>
        <rect class="band" x="${x(lo)}" y="${y - 5}" width="${Math.max(x(hi) - x(lo), 1)}" height="10"/>${marks}`
    })
    .join('')

  plot.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="ranges-cap">${grid}${bars}</svg>`
}
