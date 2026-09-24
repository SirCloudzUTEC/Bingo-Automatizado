import type { ColumnRule, Pattern } from '../types'

export const SIZE = 5
export const CELLS = SIZE * SIZE
export const CENTER = 12
export const MAX_NUMBER = 99
export const HEADERS = ['B', 'I', 'N', 'G', 'O']

/** Regla clásica del bingo de 75 bolas: B 1–15, I 16–30, N 31–45, G 46–60, O 61–75 */
export const DEFAULT_COLUMN_RULE: ColumnRule = {
  enabled: true,
  ranges: HEADERS.map((_, c) => [c * 15 + 1, c * 15 + 15]),
}

export const idx = (row: number, col: number) => row * SIZE + col

function maskFrom(fn: (row: number, col: number) => boolean): boolean[] {
  return Array.from({ length: CELLS }, (_, i) => fn(Math.floor(i / SIZE), i % SIZE))
}

export const emptyMask = () => Array<boolean>(CELLS).fill(false)

// premios según premios.md
export const BUILTIN_PATTERNS: Pattern[] = [
  { id: 'U', name: 'U', builtin: true, prize: 100, mask: maskFrom((r, c) => c === 0 || c === 4 || r === 4) },
  { id: 'T', name: 'T', builtin: true, prize: 150, mask: maskFrom((r, c) => r === 0 || c === 2) },
  { id: 'E', name: 'E', builtin: true, prize: 200, mask: maskFrom((r, c) => c === 0 || r === 0 || r === 2 || r === 4) },
  { id: 'C', name: 'C', builtin: true, prize: 250, mask: maskFrom((r, c) => c === 0 || r === 0 || r === 4) },
  { id: 'APAGON', name: 'Apagón', builtin: true, prize: 600, mask: maskFrom(() => true) },
]

export const formatPrize = (soles: number) => `S/ ${soles}`
