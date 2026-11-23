import { noiseStudy } from '../lib/noise.js'
import { fmt } from './matrix.js'

const GRID = Array.from({ length: 13 }, (_, k) => k * 0.25)
const RULES = ['RO', 'MID', 'DO']
let cache = { key: '', rows: [] }

// Small line chart; each series is labelled at its right end instead of a legend.
export function lineChart(W, { xs, series, yMax, xLabel, yLabel, marker, captionId }) {
  const H = Math.round(Math.min(260, W * 0.62))
  const pad = { l: 42, r: 46, t: 18, b: 38 }
  const xMax = xs.at(-1)
  const X = (v) => pad.l + (v / xMax) * (W - pad.l - pad.r)
  const Y = (v) => H - pad.b - (v / yMax) * (H - pad.t - pad.b)
  let out = ''
  for (let k = 0; k <= 4; k++) {
    const v = (yMax * k) / 4
    out += `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v)}" y2="${Y(v)}"/>
      <text class="muted" x="${pad.l - 6}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`
  }
  for (let k = 0; k <= 4; k++) {
    const v = (xMax * k) / 4
    out += `<text class="muted" x="${X(v)}" y="${H - pad.b + 16}" text-anchor="middle">${fmt(v)}</text>`
  }
  out += `<line class="axis" x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}"/>
    <text class="muted" x="${(pad.l + W - pad.r) / 2}" y="${H - 4}" text-anchor="middle">${xLabel}</text>
    <text class="muted" x="${pad.l}" y="${pad.t - 6}">${yLabel}</text>`
  for (const s of series) {
    const d = s.ys.map((v, k) => `${k ? 'L' : 'M'}${X(xs[k]).toFixed(1)},${Y(v).toFixed(1)}`).join('')
    out += `<path class="${s.strong ? 'strong' : 'line'}" d="${d}"/>`
  }
  // end labels go top to bottom, each at least one line below the previous
  let prev = -Infinity
  for (const s of series.filter((t) => t.label).sort((p, q) => q.ys.at(-1) - p.ys.at(-1))) {
    prev = Math.max(Y(s.ys.at(-1)) + 4, prev + 13)
    out += `<text x="${W - pad.r + 6}" y="${prev}">${s.label}</text>`
  }
  if (marker) {
    out += `<line class="grid" x1="${X(marker.x)}" x2="${X(marker.x)}" y1="${pad.t}" y2="${H - pad.b}"/>
      <circle class="dot" cx="${X(marker.x)}" cy="${Y(marker.y)}" r="4.5"/>`
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="${captionId}">${out}</svg>`
}

export function renderNoise(root, a, sigma, draws) {
  const key = JSON.stringify([a, draws])
  if (cache.key !== key) cache = { key, rows: noiseStudy(a, GRID, draws, 1) }
  const [now] = noiseStudy(a, [sigma], draws, 1)
  const rows = cache.rows
  const last = rows.at(-1).shift

  root.innerHTML = `<div class="split">
      <figure><div class="plot" data-k="0"></div>
        <figcaption id="noise-cap-0">Share of draws where the estimated matching differs from the true one, against &sigma;. The dot marks the chosen &sigma; (${fmt(now.pChange)} at &sigma; = ${fmt(sigma)}).</figcaption></figure>
      <figure><div class="plot" data-k="1"></div>
        <figcaption id="noise-cap-1">Mean L1 distance between estimated and true prices for each core point, against &sigma;. At &sigma; = 3: RO ${fmt(last.RO)}, MID ${fmt(last.MID)}, DO ${fmt(last.DO)}.</figcaption></figure>
    </div>
    <div class="wrap"><table>
      <caption class="sr">Results at the chosen sigma</caption>
      <thead><tr><th scope="col">At &sigma; = ${fmt(sigma)}</th><th scope="col">RO</th><th scope="col">MID</th><th scope="col">DO</th></tr></thead>
      <tbody>
        <tr><th scope="row">Matching changes</th><td colspan="3">${fmt(now.pChange)}</td></tr>
        <tr><th scope="row">Mean surplus lost</th><td colspan="3">${fmt(now.meanLoss)}</td></tr>
        <tr><th scope="row">Mean price shift (L1)</th>${RULES.map((r) => `<td>${fmt(now.shift[r])}</td>`).join('')}</tr>
        <tr><th scope="row">Some true pair blocks</th>${RULES.map((r) => `<td>${fmt(now.pBlock[r])}</td>`).join('')}</tr>
      </tbody></table></div>`

  const shiftMax = Math.max(1, ...rows.flatMap((r) => RULES.map((k) => r.shift[k])))
  const charts = [
    {
      xs: GRID, yMax: 1, xLabel: 'σ', yLabel: 'P(matching changes)', captionId: 'noise-cap-0',
      series: [{ ys: rows.map((r) => r.pChange), strong: true }],
      marker: { x: sigma, y: now.pChange },
    },
    {
      xs: GRID, yMax: 4 * Math.ceil(shiftMax / 4), xLabel: 'σ', yLabel: 'mean price shift', captionId: 'noise-cap-1',
      series: RULES.map((k) => ({ label: k, ys: rows.map((r) => r.shift[k]), strong: k === 'MID' })),
    },
  ]
  root.querySelectorAll('.plot').forEach((el) => {
    el.innerHTML = lineChart(Math.max(el.clientWidth, 260), charts[el.dataset.k])
  })
}
