import { describe, expect, it } from 'vitest'
import { parseNumbers } from './parse'

const seq = (n: number) => Array.from({ length: n }, (_, i) => i + 1).join(' ')

describe('parseNumbers', () => {
  it('por filas con 25 números sin centro libre', () => {
    const cells = parseNumbers(seq(25), 'rows', false)!
    expect(cells[0].value).toBe(1)
    expect(cells[5].value).toBe(6)
  })

  it('por columnas', () => {
    const cells = parseNumbers(seq(25), 'columns', false)!
    expect(cells[1].value).toBe(6) // fila 0, col 1
    expect(cells[5].value).toBe(2) // fila 1, col 0
  })

  it('24 números con centro libre salta el centro', () => {
    const cells = parseNumbers(seq(24), 'rows', true)!
    expect(cells[12].free).toBe(true)
    expect(cells[13].value).toBe(13)
    expect(cells[24].value).toBe(24)
  })

  it('25 números con centro libre ignora el del centro', () => {
    const cells = parseNumbers(seq(25).replace(/,/g, ' '), 'rows', true)!
    expect(cells[12].free).toBe(true)
    expect(cells[13].value).toBe(14)
  })

  it('cantidad incorrecta devuelve null', () => {
    expect(parseNumbers('1, 2, 3', 'rows', true)).toBeNull()
  })
})
