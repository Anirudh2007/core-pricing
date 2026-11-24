import { solveGame, worstCase, lines } from '../lib/game.js'
import { fmt } from './matrix.js'
import { lineChart } from './noise.js'

const RULES = ['RO', 'MID', 'DO']
const pct = (x) => `${Math.round(x * 100)}%`

export function renderGame(root, table) {
  const M = RULES.map((r) => [table[r].rider, table[r].driver])
  const g = solveGame(M, 'min')
  const { y, rows, envelope } = lines(M)
  const pure = RULES.filter((_, k) => Math.abs(worstCase(M, RULES.map((__, q) => +(q === k)), 'min') - g.value) < 1e-9)
  const mixed = g.rowMix.filter((x) => x > 1e-9).length > 1
  const mix = RULES.map((r, k) => [r, g.rowMix[k]]).filter(([, x]) => x > 1e-9).map(([r, x]) => `${pct(x)} ${r}`).join(', ')
  const lo = Math.max(...RULES.map((_, k) => Math.min(...M[k])))
  const hi = Math.min(...RULES.map((_, k) => Math.max(...M[k])))
  const body = M.map((row, k) => `<tr><th scope="row">${RULES[k]}</th><td>${fmt(row[0])}</td><td>${fmt(row[1])}</td><td>${fmt(Math.max(...row))}</td></tr>`).join('')

  let answer = `Any platform strategy whose worst case equals the value is optimal.`
  if (pure.length) answer = `<strong>${pure.join(' or ')}</strong> on its own already holds the gain to ${fmt(g.value)}${mixed ? `, and so does ${mix}` : ''}.`

  root.innerHTML = `<div class="card span-5">
      <h3>Payoff: best gain for the manipulator</h3>
      <div class="wrap"><table class="tbl">
        <thead><tr><th scope="col">Platform</th><th scope="col">Riders’ side</th><th scope="col">Drivers’ side</th><th scope="col">Worst</th></tr></thead>
        <tbody>${body}</tbody></table></div>
      <p class="note">${g.saddle ? `The smallest row maximum and the largest column minimum are both ${fmt(g.value)}, a pure saddle point.` : `The smallest row maximum is ${fmt(hi)} and the largest column minimum is ${fmt(lo)}, so there is no saddle point and the players mix.`}</p>
      <div class="value"><span class="fig">${fmt(g.value)}</span><span class="lbl">value of the game</span></div>
      <p class="answer">${answer}</p>
      <p class="note">The manipulator’s best reply: riders’ side ${pct(g.colMix[0])}, drivers’ side ${pct(g.colMix[1])}.</p>
    </div>
    <figure class="card span-7"><h3>Graphical method</h3><div class="plot"></div>
      <figcaption id="game-cap">Each line is one platform rule’s expected payoff when the manipulator targets riders with probability y. The platform answers on the lower envelope (blue); the manipulator picks its highest point, y = ${fmt(g.colMix[0])}, which gives the value ${fmt(g.value)}.</figcaption></figure>`

  const plot = root.querySelector('.plot')
  const W = Math.max(plot.clientWidth, 260)
  plot.innerHTML = lineChart(W, Math.round(Math.min(320, Math.max(220, W * 0.55))), {
    xs: y,
    yMax: Math.max(1, Math.ceil(Math.max(...M.flat()))),
    xLabel: 'y, chance the manipulator targets riders',
    yLabel: 'expected best gain',
    captionId: 'game-cap',
    series: [...rows.map((ys, k) => ({ label: RULES[k], ys })), { ys: envelope, strong: true }],
    marker: { x: g.colMix[0], y: g.value },
  })
}
