import type { Card, Cell, Pattern, Round } from '../types'
import { isCardValid } from './bingo'
import { CELLS, CENTER, MAX_NUMBER } from './patterns'

/**
 * Reglas del juego en un solo lugar. La UI las usa para deshabilitar acciones
 * y el store las vuelve a comprobar antes de mutar el estado (doble barrera).
 */

export type Check = { ok: true } | { ok: false; reason: string }
const ok: Check = { ok: true }
const fail = (reason: string): Check => ({ ok: false, reason })

export const isValidNumber = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= MAX_NUMBER

export function canCall(n: number, round: Round | null, cards: Card[]): Check {
  if (!round) return fail('No hay una ronda en curso')
  if (cards.length === 0) return fail('Agrega al menos una cartilla antes de cantar números')
  if (!isValidNumber(n)) return fail(`El número debe estar entre 1 y ${MAX_NUMBER}`)
  if (round.called.includes(n)) return fail(`El ${n} ya fue cantado`)
  return ok
}

export function canStartRound(pattern: Pattern | undefined, cards: Card[]): Check {
  if (cards.length === 0) return fail('Agrega al menos una cartilla para empezar')
  if (!pattern) return fail('La figura seleccionada no existe')
  if (!pattern.mask.some(Boolean)) return fail('La figura no tiene celdas')
  return ok
}

const sameLayout = (a: Cell[], b: Cell[]) => a.every((c, i) => !!c.free === !!b[i].free && c.value === b[i].value)

/** Cartilla ya registrada con exactamente los mismos números en las mismas posiciones. */
export const findIdenticalCard = (cells: Cell[], cards: Card[], excludeId?: string) =>
  cards.find((c) => c.id !== excludeId && sameLayout(c.cells, cells))

export function canSaveCard(cells: Cell[], cards: Card[], excludeId?: string): Check {
  if (cells.length !== CELLS) return fail('La cartilla debe tener 25 celdas')
  if (!isCardValid(cells)) return fail('La cartilla tiene celdas vacías, repetidas o fuera de rango')
  const twin = findIdenticalCard(cells, cards, excludeId)
  if (twin) return fail(`Es idéntica a “${twin.name}”: ¿la registraste dos veces?`)
  return ok
}

export function canSavePattern(name: string, mask: boolean[], patterns: Pattern[], excludeId?: string): Check {
  const n = name.trim().toLowerCase()
  if (!n) return fail('Ponle un nombre a la figura')
  if (mask.length !== CELLS || !mask.some(Boolean)) return fail('Marca al menos una celda')
  if (patterns.some((p) => p.id !== excludeId && p.name.trim().toLowerCase() === n)) return fail(`Ya existe una figura llamada “${name.trim()}”`)
  return ok
}

export function canRemovePattern(pattern: Pattern | undefined, round: Round | null): Check {
  if (!pattern) return fail('La figura no existe')
  if (pattern.builtin) return fail('Las figuras predefinidas no se pueden eliminar')
  if (round?.patternId === pattern.id) return fail('La figura se está usando en la ronda actual')
  return ok
}

// ---------- saneamiento de datos persistidos (localStorage editado o corrupto) ----------

const sanitizeCell = (c: unknown, i: number): Cell => {
  const cell = (c ?? {}) as Partial<Cell>
  if (cell.free && i === CENTER) return { value: null, free: true }
  return { value: isValidNumber(cell.value) ? cell.value : null }
}

export function sanitizeState(
  raw: { cards?: unknown; customPatterns?: unknown; round?: unknown },
  builtins: Pattern[],
): { cards: Card[]; customPatterns: Pattern[]; round: Round | null } {
  const cards: Card[] = (Array.isArray(raw.cards) ? raw.cards : [])
    .filter((c): c is Card => !!c && typeof c.id === 'string' && Array.isArray(c.cells) && c.cells.length === CELLS)
    .map((c) => ({ ...c, name: String(c.name ?? 'Cartilla'), cells: c.cells.map(sanitizeCell) }))

  const customPatterns: Pattern[] = (Array.isArray(raw.customPatterns) ? raw.customPatterns : [])
    .filter((p): p is Pattern => !!p && typeof p.id === 'string' && Array.isArray(p.mask) && p.mask.length === CELLS && p.mask.some(Boolean))
    .map((p) => ({ ...p, builtin: false, mask: p.mask.map(Boolean) }))

  const patternIds = new Set([...builtins, ...customPatterns].map((p) => p.id))
  const r = raw.round as Round | null | undefined
  const round =
    r && typeof r.id === 'string' && patternIds.has(r.patternId) && Array.isArray(r.called)
      ? { ...r, called: [...new Set(r.called.filter(isValidNumber))] }
      : null

  return { cards, customPatterns, round }
}
