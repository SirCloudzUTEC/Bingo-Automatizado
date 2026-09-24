import { beforeEach, describe, expect, it } from 'vitest'
import { CENTER, DEFAULT_COLUMN_RULE } from '../lib/patterns'
import type { Cell } from '../types'
import { useBingoStore } from './useBingoStore'

const cells = (offset = 0): Cell[] => Array.from({ length: 25 }, (_, i) => (i === CENTER ? { value: null, free: true } : { value: i + 1 + offset }))
const s = () => useBingoStore.getState()

// los tests generales usan cartillas 1..25 fila por fila, que no siguen la regla de columnas
const noRule = { ...DEFAULT_COLUMN_RULE, enabled: false }
beforeEach(() => useBingoStore.setState({ cards: [], customPatterns: [], round: null, columnRule: noRule }))

/** cartilla válida con la regla clásica: columna c lleva c*15+1 … c*15+5 */
const bingoCells = (): Cell[] =>
  Array.from({ length: 25 }, (_, i) => (i === CENTER ? { value: null, free: true } : { value: (i % 5) * 15 + Math.floor(i / 5) + 1 }))

describe('store: regla de columnas', () => {
  beforeEach(() => useBingoStore.setState({ columnRule: DEFAULT_COLUMN_RULE }))

  it('viene activa por defecto con B 1–15 … O 61–75', () => {
    expect(DEFAULT_COLUMN_RULE.enabled).toBe(true)
    expect(DEFAULT_COLUMN_RULE.ranges).toEqual([[1, 15], [16, 30], [31, 45], [46, 60], [61, 75]])
  })

  it('rechaza cartillas con números fuera de su columna', () => {
    expect(s().saveCard({ name: 'X', theme: 'sky', cells: cells() }).ok).toBe(false)
    expect(s().saveCard({ name: 'A', theme: 'sky', cells: bingoCells() }).ok).toBe(true)
  })

  it('no canta números fuera de todos los rangos', () => {
    s().saveCard({ name: 'A', theme: 'sky', cells: bingoCells() })
    s().startRound('T')
    expect(s().callNumber(80).ok).toBe(false)
    expect(s().callNumber(75).ok).toBe(true)
  })

  it('se puede modificar pero no con rangos superpuestos', () => {
    const ranges = DEFAULT_COLUMN_RULE.ranges.map(([a, b]) => [a, b] as [number, number])
    ranges[0] = [1, 20]
    expect(s().setColumnRule({ enabled: true, ranges }).ok).toBe(false)
    ranges[0] = [1, 10]
    expect(s().setColumnRule({ enabled: true, ranges }).ok).toBe(true)
    expect(s().columnRule.ranges[0]).toEqual([1, 10])
    expect(s().setColumnRule({ ...s().columnRule, enabled: false }).ok).toBe(true)
    expect(s().saveCard({ name: 'X', theme: 'sky', cells: cells() }).ok).toBe(true)
  })
})

describe('store: segunda barrera aunque la UI falle', () => {
  it('no empieza ronda ni canta sin cartillas', () => {
    expect(s().startRound('T').ok).toBe(false)
    expect(s().round).toBeNull()
    // ronda forzada sin cartillas (p. ej. se borraron todas)
    useBingoStore.setState({ round: { id: 'r', patternId: 'T', called: [], startedAt: 0 } })
    expect(s().callNumber(5).ok).toBe(false)
    expect(s().round!.called).toEqual([])
  })

  it('canta solo números válidos y no repetidos', () => {
    s().saveCard({ name: 'A', theme: 'sky', cells: cells() })
    expect(s().startRound('T').ok).toBe(true)
    expect(s().callNumber(5).ok).toBe(true)
    expect(s().callNumber(5).ok).toBe(false)
    expect(s().callNumber(0).ok).toBe(false)
    expect(s().callNumber(100).ok).toBe(false)
    expect(s().round!.called).toEqual([5])
  })

  it('rechaza cartillas inválidas o idénticas', () => {
    const bad = cells()
    bad[0] = { value: null }
    expect(s().saveCard({ name: 'X', theme: 'sky', cells: bad }).ok).toBe(false)
    expect(s().saveCard({ name: 'A', theme: 'sky', cells: cells() }).ok).toBe(true)
    expect(s().saveCard({ name: 'B', theme: 'sky', cells: cells() }).ok).toBe(false)
    expect(s().cards).toHaveLength(1)
  })

  it('no elimina la figura usada en la ronda ni guarda nombres repetidos', () => {
    s().saveCard({ name: 'A', theme: 'sky', cells: cells() })
    const res = s().savePattern('X', Array(25).fill(true))
    expect(res.ok).toBe(true)
    expect(s().savePattern('x', Array(25).fill(true)).ok).toBe(false)
    const id = res.ok ? res.id : ''
    s().startRound(id)
    expect(s().removePattern(id).ok).toBe(false)
    expect(s().customPatterns).toHaveLength(1)
  })
})
