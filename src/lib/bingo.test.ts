import { describe, expect, it } from 'vitest'
import type { Card } from '../types'
import { buildIndex, evaluateAll, evaluateCard, hitsForNumber, validateCard } from './bingo'
import { BUILTIN_PATTERNS, CENTER } from './patterns'

const P = Object.fromEntries(BUILTIN_PATTERNS.map((p) => [p.id, p]))

/** cartilla con valores 1..25 fila por fila (centro opcionalmente libre) */
function makeCard(id = 'a', freeCenter = true): Card {
  return {
    id,
    name: id,
    theme: 'sky',
    createdAt: 0,
    cells: Array.from({ length: 25 }, (_, i) => (freeCenter && i === CENTER ? { value: null, free: true } : { value: i + 1 })),
  }
}

describe('evaluateCard', () => {
  it('patrones predefinidos tienen el tamaño esperado', () => {
    const count = (id: string) => P[id].mask.filter(Boolean).length
    expect(count('U')).toBe(13)
    expect(count('T')).toBe(9)
    expect(count('E')).toBe(17)
    expect(count('C')).toBe(13)
  })

  it('T se completa con fila 0 y columna 2, contando el centro libre', () => {
    const card = makeCard()
    const called = new Set([1, 2, 3, 4, 5, 8, 18, 23]) // col 2 sin el 13 (centro libre)
    const ev = evaluateCard(card, P.T, called)
    expect(ev.complete).toBe(true)
    expect(ev.missing).toEqual([])
  })

  it('T sin centro libre requiere el 13', () => {
    const card = makeCard('b', false)
    const ev = evaluateCard(card, P.T, new Set([1, 2, 3, 4, 5, 8, 18, 23]))
    expect(ev.complete).toBe(false)
    expect(ev.missing).toEqual([13])
  })

  it('números fuera de la letra no cuentan', () => {
    const ev = evaluateCard(makeCard(), P.U, new Set([7, 8, 9]))
    expect(ev.marked).toEqual([])
    expect(ev.missing).toHaveLength(13)
  })

  it('cartilla agregada tarde se evalúa con el historial', () => {
    const history = [1, 6, 11, 16, 21, 22, 23, 24, 25, 5, 10, 15]
    const late = makeCard('late')
    const ev = evaluateCard(late, P.U, new Set(history))
    expect(ev.missing).toEqual([20])
    expect(evaluateCard(late, P.U, new Set([...history, 20])).complete).toBe(true)
  })

  it('evaluateAll ordena por menos faltantes', () => {
    const a = makeCard('a')
    const b = { ...makeCard('b'), cells: makeCard('b').cells.map((c) => (c.value ? { value: c.value + 50 } : c)) }
    const res = evaluateAll([b, a], P.C, [1, 2, 3])
    expect(res[0].cardId).toBe('a')
  })
})

describe('hitsForNumber', () => {
  it('distingue dentro/fuera de la letra', () => {
    const idx = buildIndex([makeCard('a'), makeCard('b')])
    expect(hitsForNumber(idx, P.T, 3).every((h) => h.inPattern)).toBe(true)
    expect(hitsForNumber(idx, P.T, 7).some((h) => h.inPattern)).toBe(false)
    expect(hitsForNumber(idx, P.T, 99)).toEqual([])
  })
})

describe('validateCard', () => {
  it('detecta duplicados, vacíos y fuera de rango', () => {
    const cells = makeCard().cells.map((c) => ({ ...c }))
    cells[0].value = 2
    cells[1].value = null
    cells[3].value = 150
    const v = validateCard(cells)
    expect([...v.duplicates]).toEqual([])
    expect(v.empty).toEqual([1])
    expect(v.outOfRange).toEqual([3])
    cells[1].value = 2
    expect([...validateCard(cells).duplicates]).toEqual([2])
  })
})
