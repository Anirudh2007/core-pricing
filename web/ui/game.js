import { solveGame, lines } from '../lib/game.js'
import { fmt } from './matrix.js'
import { lineChart } from './noise.js'

const RULES = ['RO', 'MID', 'DO']
const SIDES = ["riders' side", "drivers' side"]
const mix = (xs, names) => xs.map((x, k) => `${names[k]} ${fmt(x)}`).join(', ')

export function renderGame(root, table) {
  const M = RULES.map((r) => [table[r].rider, table[r].driver])
  const g = solveGame(M, 'min')
  const { y, rows, envelope } = lines(M)
  const body = M.map((row, k) => `<tr><th scope="row">${RULES[k]}</th><td>${fmt(row[0])}</td><td>${fmt(row[1])}</td></tr>`).join('')
  const pure = g.rowMix.indexOf(1)

  root.innerHTML = `<div class="split">
      <div>
        <div class="wrap"><table>
          <caption class="sr">Payoff matrix: best gain for the manipulator</caption>
          <thead><tr><th scope="col">Platform</th><th scope="col">Riders' side</th><th scope="col">Drivers' side</th></tr></thead>
          <tbody>${body}</tbody></table></div>
        <p class="stat">Value of the game: <strong>${fmt(g.value)}</strong>${g.saddle ? ' (pure saddle point)' : ', no saddle point'}.</p>
        <p class="stat">Platform: ${pure >= 0 ? `pure ${RULES[pure]}` : mix(g.rowMix, RULES)}.<br>Manipulator: ${mix(g.colMix, SIDES)}.</p>
        <p class="small">Any platform strategy whose worst case equals the value is optimal. For instance B, pure MID and a half-and-half mix of RO and DO both reach it.</p>
      </div>
      <figure><div class="plot"></div>
        <figcaption id="game-cap">Graphical method. Each line is a platform rule's expected payoff when the manipulator targets riders with probability y. The platform answers on the lower envelope (bold); the manipulator takes its highest point, y = ${fmt(g.colMix[0])}, value ${fmt(g.value)}.</figcaption></figure>
    </div>`

  const plot = root.querySelector('.plot')
  plot.innerHTML = lineChart(Math.max(plot.clientWidth, 260), {
    xs: y,
    yMax: Math.max(1, Math.ceil(Math.max(...M.flat()))),
    xLabel: 'y = P(manipulator targets riders)',
    yLabel: 'expected best gain',
    captionId: 'game-cap',
    series: [...rows.map((ys, k) => ({ label: RULES[k], ys })), { ys: envelope, strong: true }],
    marker: { x: g.colMix[0], y: g.value },
  })
}
