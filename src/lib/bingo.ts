import type { Card, Cell, Pattern } from '../types'
import { CELLS, CENTER, MAX_NUMBER } from './patterns'

export const emptyCells = (freeCenter = true): Cell[] =>
  Array.from({ length: CELLS }, (_, i) => (i === CENTER && freeCenter ? { value: null, free: true } : { value: null }))

export type CardEval = {
  cardId: string
  /** índices de celdas que pertenecen a la letra */
  required: number[]
  /** índices de la letra ya cubiertos (cantados o libres) */
  marked: number[]
  /** números de la letra que aún faltan */
  missing: number[]
  total: number
  complete: boolean
}

export function isMarked(cell: Cell, called: Set<number>) {
  return !!cell.free || (cell.value != null && called.has(cell.value))
}

export function evaluateCard(card: Card, pattern: Pattern, called: Set<number>): CardEval {
  const required: number[] = []
  const marked: number[] = []
  const missing: number[] = []
  for (let i = 0; i < CELLS; i++) {
    if (!pattern.mask[i]) continue
    required.push(i)
    const cell = card.cells[i]
    if (isMarked(cell, called)) marked.push(i)
    else if (cell.value != null) missing.push(cell.value)
  }
  // una celda vacía dentro de la letra nunca se completa
  const complete = required.length > 0 && marked.length === required.length
  return { cardId: card.id, required, marked, missing, total: required.length, complete }
}

/** Evalúa todas las cartillas, ordenadas por cercanía a completar la letra. */
export function evaluateAll(cards: Card[], pattern: Pattern, called: Iterable<number>) {
  const set = new Set(called)
  return cards
    .map((c) => evaluateCard(c, pattern, set))
    .sort((a, b) => a.total - a.marked.length - (b.total - b.marked.length))
}

export type Hit = { cardId: string; index: number; inPattern: boolean }

/** Índice número → ubicaciones en cartillas, para consultar en O(1) cada número cantado. */
export function buildIndex(cards: Card[]) {
  const map = new Map<number, { cardId: string; index: number }[]>()
  for (const card of cards) {
    card.cells.forEach((cell, index) => {
      if (cell.value == null || cell.free) return
      const list = map.get(cell.value)
      if (list) list.push({ cardId: card.id, index })
      else map.set(cell.value, [{ cardId: card.id, index }])
    })
  }
  return map
}

export function hitsForNumber(index: ReturnType<typeof buildIndex>, pattern: Pattern, n: number): Hit[] {
  return (index.get(n) ?? []).map((h) => ({ ...h, inPattern: pattern.mask[h.index] }))
}

export type CardIssues = { duplicates: Set<number>; empty: number[]; outOfRange: number[] }

export function validateCard(cells: Cell[]): CardIssues {
  const seen = new Map<number, number>()
  const empty: number[] = []
  const outOfRange: number[] = []
  cells.forEach((cell, i) => {
    if (cell.free) return
    if (cell.value == null) return void empty.push(i)
    if (cell.value < 1 || cell.value > MAX_NUMBER) outOfRange.push(i)
    seen.set(cell.value, (seen.get(cell.value) ?? 0) + 1)
  })
  const duplicates = new Set([...seen].filter(([, n]) => n > 1).map(([v]) => v))
  return { duplicates, empty, outOfRange }
}

export const isCardValid = (cells: Cell[]) => {
  const v = validateCard(cells)
  return v.duplicates.size === 0 && v.empty.length === 0 && v.outOfRange.length === 0
}
