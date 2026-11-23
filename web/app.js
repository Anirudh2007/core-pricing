import { renderMatrix } from './ui/matrix.js'
import { renderRanges } from './ui/ranges.js'
import { renderNoise } from './ui/noise.js'
import { renderManipulation } from './ui/manipulation.js'
import { renderGame } from './ui/game.js'

const PRESETS = {
  A: [[10, 6], [7, 4]],
  B: [[12, 10, 6], [11, 7, 4], [9, 11, 9]],
}
let a = PRESETS.B

const $ = (s) => document.querySelector(s)
const sigma = $('#sigma')
const draws = $('#draws')
const showSigma = () => ($('#sigma-out').value = Number(sigma.value).toFixed(2))

function noise() {
  showSigma()
  renderNoise($('#noise-view'), a, Number(sigma.value), Number(draws.value))
}

function render() {
  renderMatrix($('#matrix-view'), a, (next) => {
    a = next
    render()
  })
  renderRanges($('#ranges-view'), a)
  renderGame($('#game-view'), renderManipulation($('#manip-view'), a))
  for (const b of document.querySelectorAll('[data-size]')) {
    const op = b.dataset.size
    const size = op.startsWith('row') ? a.length : a[0].length
    b.disabled = op.endsWith('+') ? size >= 4 : size <= 1
  }
  noise()
}

for (const b of document.querySelectorAll('[data-preset]')) {
  b.addEventListener('click', () => {
    a = PRESETS[b.dataset.preset]
    render()
  })
}

for (const b of document.querySelectorAll('[data-size]')) {
  b.addEventListener('click', () => {
    const op = b.dataset.size
    if (op === 'row+') a = [...a, a[0].map(() => 0)]
    if (op === 'row-') a = a.slice(0, -1)
    if (op === 'col+') a = a.map((row) => [...row, 0])
    if (op === 'col-') a = a.map((row) => row.slice(0, -1))
    render()
  })
}

sigma.addEventListener('input', showSigma)
sigma.addEventListener('change', noise)
draws.addEventListener('change', noise)

let timer
window.addEventListener('resize', () => {
  clearTimeout(timer)
  timer = setTimeout(render, 150)
})

render()
