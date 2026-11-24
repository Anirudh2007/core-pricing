import { renderMatrix } from './ui/matrix.js'
import { renderMarket } from './ui/market.js'
import { renderRanges, renderRangeTable } from './ui/ranges.js'
import { renderNoise } from './ui/noise.js'
import { renderManipulation } from './ui/manipulation.js'
import { renderGame } from './ui/game.js'

const PRESETS = {
  A: [[10, 6], [7, 4]],
  B: [[12, 10, 6], [11, 7, 4], [9, 11, 9]],
}
const state = { a: PRESETS.B, preset: 'B', t: 0.5, draws: 2000 }

const $ = (s) => document.querySelector(s)
const sigma = $('#sigma')
const showSigma = () => ($('#sigma-out').value = Number(sigma.value).toFixed(2))

function noise() {
  showSigma()
  for (const b of document.querySelectorAll('[data-draws]')) b.setAttribute('aria-pressed', String(+b.dataset.draws === state.draws))
  renderNoise($('#noise-view'), state.a, Number(sigma.value), state.draws)
}

const on = {
  preset(name) {
    Object.assign(state, { a: PRESETS[name], preset: name })
    render()
  },
  edit(a) {
    Object.assign(state, { a, preset: null })
    render()
  },
  resize(op) {
    let { a } = state
    if (op === 'row+') a = [...a, a[0].map(() => 0)]
    if (op === 'row-') a = a.slice(0, -1)
    if (op === 'col+') a = a.map((row) => [...row, 0])
    if (op === 'col-') a = a.map((row) => row.slice(0, -1))
    Object.assign(state, { a, preset: null })
    render()
  },
}

function render() {
  renderMatrix($('#matrix-view'), state.a, state.preset, on)
  renderMarket($('#market-view'), state.a, state.t, (t) => {
    state.t = t
    renderRanges($('#ranges-view'), state.a, t)
  })
  renderRanges($('#ranges-view'), state.a, state.t)
  renderRangeTable($('#ranges-table'), state.a)
  renderGame($('#game-view'), renderManipulation($('#manip-view'), state.a))
  noise()
}

sigma.addEventListener('input', showSigma)
sigma.addEventListener('change', noise)
for (const b of document.querySelectorAll('[data-draws]')) {
  b.addEventListener('click', () => {
    state.draws = +b.dataset.draws
    noise()
  })
}

let timer
let width = innerWidth
addEventListener('resize', () => {
  if (innerWidth === width) return
  width = innerWidth
  clearTimeout(timer)
  timer = setTimeout(render, 150)
})

render()
