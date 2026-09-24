import { describe, expect, it } from 'vitest'
import type { Card, Cell, Round } from '../types'
import { canCall, canRemovePattern, canSaveCard, canSavePattern, canStartRound, sanitizeState } from './guards'
import { BUILTIN_PATTERNS, CENTER } from './patterns'

const cells = (offset = 0): Cell[] => Array.from({ length: 25 }, (_, i) => (i === CENTER ? { value: null, free: true } : { value: i + 1 + offset }))
const card = (id: string, offset = 0): Card => ({ id, name: id, theme: 'sky', createdAt: 0, cells: cells(offset) })
const round = (called: number[] = []): Round => ({ id: 'r', patternId: 'T', called, startedAt: 0 })
const T = BUILTIN_PATTERNS[1]

describe('canCall', () => {
  it('bloquea cantar sin cartillas', () => expect(canCall(5, round(), []).ok).toBe(false))
  it('bloquea cantar sin ronda', () => expect(canCall(5, null, [card('a')]).ok).toBe(false))
  it('bloquea fuera de rango y no enteros', () => {
    for (const n of [0, 100, 2.5, NaN]) expect(canCall(n, round(), [card('a')]).ok).toBe(false)
  })
  it('bloquea repetidos', () => expect(canCall(5, round([5]), [card('a')]).ok).toBe(false))
  it('permite un número válido', () => expect(canCall(5, round(), [card('a')]).ok).toBe(true))
})

describe('canStartRound', () => {
  it('requiere cartillas', () => expect(canStartRound(T, []).ok).toBe(false))
  it('requiere figura existente', () => expect(canStartRound(undefined, [card('a')]).ok).toBe(false))
  it('ok con cartilla y figura', () => expect(canStartRound(T, [card('a')]).ok).toBe(true))
})

describe('canSaveCard', () => {
  it('rechaza cartilla incompleta', () => {
    const c = cells()
    c[0] = { value: null }
    expect(canSaveCard(c, []).ok).toBe(false)
  })
  it('rechaza cartilla idéntica a otra, salvo a sí misma', () => {
    const cards = [card('a')]
    expect(canSaveCard(cells(), cards).ok).toBe(false)
    expect(canSaveCard(cells(), cards, 'a').ok).toBe(true)
    expect(canSaveCard(cells(50), cards).ok).toBe(true)
  })
})

describe('patrones', () => {
  it('rechaza nombre duplicado y máscara vacía', () => {
    const mask = T.mask
    expect(canSavePattern('t', mask, BUILTIN_PATTERNS).ok).toBe(false)
    expect(canSavePattern('X', Array(25).fill(false), BUILTIN_PATTERNS).ok).toBe(false)
    expect(canSavePattern('X', mask, BUILTIN_PATTERNS).ok).toBe(true)
  })
  it('no elimina predefinidas ni la figura en uso', () => {
    expect(canRemovePattern(T, null).ok).toBe(false)
    const custom = { ...T, id: 'x', builtin: false }
    expect(canRemovePattern(custom, { ...round(), patternId: 'x' }).ok).toBe(false)
    expect(canRemovePattern(custom, null).ok).toBe(true)
  })
})

describe('sanitizeState', () => {
  it('descarta datos corruptos', () => {
    const s = sanitizeState(
      {
        cards: [card('a'), { id: 'bad', cells: [1, 2] }, null],
        customPatterns: [{ id: 'p', name: 'P', mask: Array(25).fill(false) }],
        round: { id: 'r', patternId: 'T', called: [3, 3, 150, 'x', 7], startedAt: 0 },
      },
      BUILTIN_PATTERNS,
    )
    expect(s.cards.map((c) => c.id)).toEqual(['a'])
    expect(s.customPatterns).toEqual([])
    expect(s.round?.called).toEqual([3, 7])
  })
  it('descarta la ronda si su figura ya no existe', () => {
    expect(sanitizeState({ round: { ...round(), patternId: 'gone' } }, BUILTIN_PATTERNS).round).toBeNull()
  })
})
