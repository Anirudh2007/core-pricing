import { RULES } from '../lib/core.js'
import { noiseStudy } from '../lib/noise.js'
import { fmt } from './matrix.js'

const GRID = Array.from({ length: 13 }, (_, k) => k * 0.25)
let cache = { key: '', rows: [] }

// Line chart with direct labels at the line ends instead of a legend.
export function lineChart(W, H, { xs, series, yMax, xLabel, yLabel, marker, captionId }) {
  const pad = { l: 40, r: series.some((s) => s.label) ? 44 : 12, t: 24, b: 40 }
  const xMax = xs.at(-1)
  const X = (v) => pad.l + (v / xMax) * (W - pad.l - pad.r)
  const Y = (v) => H - pad.b - (v / yMax) * (H - pad.t - pad.b)
  let out = `<text x="0" y="12">${yLabel}</text>`
  for (let k = 0; k <= 4; k++) {
    const v = (yMax * k) / 4
    out += `<line class="${k ? 'grid' : 'axis'}" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pad.l - 8}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`
  }
  for (let k = 0; k <= 4; k++) {
    const v = (xMax * k) / 4
    out += `<text x="${X(v)}" y="${H - pad.b + 18}" text-anchor="middle">${fmt(v)}</text>`
  }
  out += `<text x="${(pad.l + W - pad.r) / 2}" y="${H - 4}" text-anchor="middle">${xLabel}</text>`
  if (marker) out += `<line class="axis" x1="${X(marker.x)}" x2="${X(marker.x)}" y1="${pad.t}" y2="${H - pad.b}" stroke-dasharray="3 3"/>`
  for (const s of [...series].sort((p, q) => !!p.strong - !!q.strong)) {
    const d = s.ys.map((v, k) => `${k ? 'L' : 'M'}${X(xs[k]).toFixed(1)},${Y(v).toFixed(1)}`).join('')
    out += `<path class="${s.strong ? 'hi' : 'ln'}" d="${d}"/>`
  }
  // end labels go top to bottom, each at least one line below the previous
  let prev = -Infinity
  for (const s of series.filter((q) => q.label).sort((p, q) => q.ys.at(-1) - p.ys.at(-1))) {
    prev = Math.max(Y(s.ys.at(-1)) + 4, prev + 14)
    out += `<text x="${W - pad.r + 8}" y="${prev}" class="${s.strong ? 'lab-hi' : 'ink'}">${s.label}</text>`
  }
  if (marker) out += `<circle class="dot" cx="${X(marker.x)}" cy="${Y(marker.y)}" r="5.5"/>`
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="${captionId}">${out}</svg>`
}

export function renderNoise(root, a, sigma, draws) {
  const key = JSON.stringify([a, draws])
  if (cache.key !== key) cache = { key, rows: noiseStudy(a, GRID, draws, 1) }
  const [now] = noiseStudy(a, [sigma], draws, 1)
  const rows = cache.rows
  const last = rows.at(-1).shift
  const s = fmt(sigma)

  root.innerHTML = `<div class="grid">
      <figure class="span-8"><div class="plot" data-k="0"></div>
        <figcaption id="noise-cap-0">How often the estimated matching differs from the true one, for &sigma; from 0 to 3. The dot is the chosen &sigma; = ${s}, where the share is ${fmt(now.pChange)}.</figcaption></figure>
      <div class="span-4">
        <div class="stats">
          <div class="stat"><div class="k">Matching changes</div><div class="n">${Math.round(now.pChange * 100)}%</div></div>
          <div class="stat"><div class="k">Surplus lost, mean</div><div class="n">${fmt(now.meanLoss)}</div></div>
        </div>
        <table class="tbl">
          <caption class="sr">Price results at sigma ${s}</caption>
          <thead><tr><th scope="col">At &sigma; = ${s}</th><th scope="col">RO</th><th scope="col">MID</th><th scope="col">DO</th></tr></thead>
          <tbody>
            <tr><th scope="row">Price shift</th>${RULES.map((r) => `<td>${fmt(now.shift[r])}</td>`).join('')}</tr>
            <tr><th scope="row">Some pair blocks</th>${RULES.map((r) => `<td>${Math.round(now.pBlock[r] * 100)}%</td>`).join('')}</tr>
          </tbody>
        </table>
        <p class="note">Price shift is the mean total distance between estimated and true shares. “Some pair blocks” means some true pair would earn more by leaving.</p>
        <figure class="sub-fig"><div class="plot" data-k="1"></div>
          <figcaption id="noise-cap-1">Price shift against &sigma;. At &sigma; = 3: RO ${fmt(last.RO)}, MID ${fmt(last.MID)}, DO ${fmt(last.DO)}. MID moves least.</figcaption></figure>
      </div>
    </div>`

  const shiftMax = 4 * Math.ceil(Math.max(1, ...rows.flatMap((r) => RULES.map((k) => r.shift[k]))) / 4)
  const charts = [
    {
      h: (w) => Math.round(Math.min(340, Math.max(240, w * 0.5))),
      xs: GRID, yMax: 1, xLabel: 'error σ', yLabel: 'share of draws where the matching changes', captionId: 'noise-cap-0',
      series: [{ ys: rows.map((r) => r.pChange), strong: true }],
      marker: { x: sigma, y: now.pChange },
    },
    {
      h: () => 180,
      xs: GRID, yMax: shiftMax, xLabel: 'error σ', yLabel: 'mean price shift', captionId: 'noise-cap-1',
      series: RULES.map((k) => ({ label: k, ys: rows.map((r) => r.shift[k]), strong: k === 'MID' })),
    },
  ]
  root.querySelectorAll('.plot').forEach((el) => {
    const c = charts[el.dataset.k]
    const W = Math.max(el.clientWidth, 260)
    el.innerHTML = lineChart(W, c.h(W), c)
  })
}
