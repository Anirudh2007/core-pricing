import { bestMatching } from '../lib/assignment.js'
import { hungarianSteps } from '../lib/hungarian.js'

export const fmt = (x) => String(+x.toFixed(2))
export const pairText = ([i, j]) => `R${i + 1} with D${j + 1}`

function stage({ label, matrix }) {
  const body = matrix.map((row) => `<tr>${row.map((x) => `<td class="${x === 0 ? 'z' : ''}">${fmt(x)}</td>`).join('')}</tr>`).join('')
  return `<table class="mini"><caption>${label}</caption><tbody>${body}</tbody></table>`
}

function stepper(label, one, key, n) {
  return `<span class="step" role="group" aria-label="${label}">${label}
    <button type="button" data-size="${key}-" aria-label="Remove a ${one}" ${n <= 1 ? 'disabled' : ''}>&minus;</button>
    <output>${n}</output>
    <button type="button" data-size="${key}+" aria-label="Add a ${one}" ${n >= 4 ? 'disabled' : ''}>+</button></span>`
}

export function renderMatrix(root, a, preset, on) {
  const { value, pairs } = bestMatching(a)
  const hit = new Set(pairs.map(([i, j]) => `${i},${j}`))
  const n = a[0].length
  const head = Array.from({ length: n }, (_, j) => `<th scope="col">D${j + 1}</th>`).join('')
  const body = a
    .map((row, i) => {
      const cells = row
        .map((x, j) => {
          const m = hit.has(`${i},${j}`)
          return `<td class="${m ? 'on' : ''}"><input type="number" inputmode="decimal" name="a-${i}-${j}" autocomplete="off" min="0" step="0.5" value="${x}"
            aria-label="Surplus of rider ${i + 1} with driver ${j + 1}${m ? ', matched' : ''}" data-i="${i}" data-j="${j}"></td>`
        })
        .join('')
      return `<tr><th scope="row" class="r">R${i + 1}</th>${cells}</tr>`
    })
    .join('')

  let steps = ''
  if (a.length === n) {
    const h = hungarianSteps(a)
    steps = `<details><summary>Hungarian method on this matrix</summary>
      <div class="stages">${h.stages.map(stage).join('')}</div>
      <p class="note">Minimise K minus a, then reduce rows and columns until the zeros hold a full assignment: ${h.pairs.map(pairText).join(', ')}.</p></details>`
  }

  root.innerHTML = `<h3>Surplus matrix</h3>
    <div class="row">
      <div class="seg" role="group" aria-label="Example markets">
        <button type="button" data-preset="A" aria-pressed="${preset === 'A'}">Instance A</button>
        <button type="button" data-preset="B" aria-pressed="${preset === 'B'}">Instance B</button>
      </div>
      ${stepper('Riders', 'rider', 'row', a.length)}
      ${stepper('Drivers', 'driver', 'col', n)}
    </div>
    <div class="wrap"><table class="matrix">
      <caption class="sr">Predicted surplus, riders in rows and drivers in columns. Matched cells are outlined.</caption>
      <thead><tr><td></td>${head}</tr></thead><tbody>${body}</tbody></table></div>
    <div class="total"><span class="fig">${fmt(value)}</span><span class="lbl">total surplus of the optimal matching</span></div>
    <p class="error" id="matrix-error" role="alert" hidden></p>
    ${steps}`

  root.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => on.preset(b.dataset.preset)))
  root.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => on.resize(b.dataset.size)))
  root.querySelectorAll('input').forEach((input) => {
    input.addEventListener('change', () => {
      const x = Number(input.value)
      if (input.value.trim() === '' || !Number.isFinite(x) || x < 0) {
        input.setAttribute('aria-invalid', 'true')
        const err = root.querySelector('#matrix-error')
        err.textContent = `R${+input.dataset.i + 1}, D${+input.dataset.j + 1}: enter a surplus of 0 or more.`
        err.hidden = false
        return
      }
      const next = a.map((row) => [...row])
      next[input.dataset.i][input.dataset.j] = x
      on.edit(next)
    })
  })
}
