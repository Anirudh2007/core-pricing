import { bestMatching } from '../lib/assignment.js'
import { hungarianSteps } from '../lib/hungarian.js'

export const fmt = (x) => String(+x.toFixed(2))

function small(caption, c) {
  const body = c.map((row) => `<tr>${row.map((x) => `<td>${fmt(x)}</td>`).join('')}</tr>`).join('')
  return `<table><caption>${caption}</caption><tbody>${body}</tbody></table>`
}

export function renderMatrix(root, a, onChange) {
  const { value, pairs } = bestMatching(a)
  const on = new Set(pairs.map(([i, j]) => `${i},${j}`))
  const n = a[0].length
  const head = Array.from({ length: n }, (_, j) => `<th scope="col">D${j + 1}</th>`).join('')
  const body = a
    .map((row, i) => {
      const cells = row
        .map((x, j) => {
          const hit = on.has(`${i},${j}`)
          const label = `Surplus of rider ${i + 1} with driver ${j + 1}${hit ? ', matched' : ''}`
          return `<td class="${hit ? 'on' : ''}"><input type="number" inputmode="decimal" min="0" step="0.5" value="${x}" aria-label="${label}" data-i="${i}" data-j="${j}"></td>`
        })
        .join('')
      return `<tr><th scope="row">R${i + 1}</th>${cells}</tr>`
    })
    .join('')

  let steps = ''
  if (a.length === n) {
    const h = hungarianSteps(a)
    steps = `<details><summary>Hungarian method on this matrix</summary>
      <div class="stages">${h.stages.map((s) => small(s.label, s.matrix)).join('')}</div>
      <p class="small">Assignment from the zero cells: ${h.pairs.map(([i, j]) => `R${i + 1}-D${j + 1}`).join(', ')}.</p></details>`
  }

  root.innerHTML = `<div class="wrap"><table class="matrix">
      <caption class="sr">Predicted surplus, riders in rows and drivers in columns</caption>
      <thead><tr><td></td>${head}</tr></thead><tbody>${body}</tbody></table></div>
    <p class="stat" id="matrix-msg">Total surplus V = <strong>${fmt(value)}</strong>. Matching: ${pairs.map(([i, j]) => `R${i + 1}-D${j + 1}`).join(', ') || 'none'}.</p>
    ${steps}`

  root.querySelectorAll('input').forEach((input) => {
    input.addEventListener('change', () => {
      const x = Number(input.value)
      if (input.value.trim() === '' || !Number.isFinite(x) || x < 0) {
        input.setAttribute('aria-invalid', 'true')
        root.querySelector('#matrix-msg').innerHTML = '<span class="error">Each surplus must be a number of at least 0.</span>'
        return
      }
      const next = a.map((row) => [...row])
      next[input.dataset.i][input.dataset.j] = x
      onChange(next)
    })
  })
}
