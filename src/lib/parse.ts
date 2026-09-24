import type { Cell } from '../types'
import { CELLS, CENTER, SIZE } from './patterns'

export type ParseOrder = 'rows' | 'columns'

/**
 * Convierte texto libre ("12 5 33, 7…") en 25 celdas.
 * Si hay centro libre se aceptan 24 números (se salta el centro) o 25 (se ignora el del centro).
 */
export function parseNumbers(text: string, order: ParseOrder, freeCenter: boolean): Cell[] | null {
  const nums = (text.match(/\d+/g) ?? []).map(Number)
  const expected = freeCenter ? [CELLS - 1, CELLS] : [CELLS]
  if (!expected.includes(nums.length)) return null

  // orden de llenado en índices fila*5+col
  const fillOrder = Array.from({ length: CELLS }, (_, k) =>
    order === 'rows' ? k : (k % SIZE) * SIZE + Math.floor(k / SIZE),
  )
  const cells: Cell[] = Array.from({ length: CELLS }, () => ({ value: null }))
  let p = 0
  for (const i of fillOrder) {
    if (freeCenter && i === CENTER) {
      cells[i] = { value: null, free: true }
      if (nums.length === CELLS) p++
      continue
    }
    cells[i] = { value: nums[p++] }
  }
  return cells
}
