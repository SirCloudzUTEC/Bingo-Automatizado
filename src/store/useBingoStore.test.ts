import { beforeEach, describe, expect, it } from 'vitest'
import { CENTER } from '../lib/patterns'
import type { Cell } from '../types'
import { useBingoStore } from './useBingoStore'

const cells = (offset = 0): Cell[] => Array.from({ length: 25 }, (_, i) => (i === CENTER ? { value: null, free: true } : { value: i + 1 + offset }))
const s = () => useBingoStore.getState()

beforeEach(() => useBingoStore.setState({ cards: [], customPatterns: [], round: null }))

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
