import type { Pattern } from '../types'

export const SIZE = 5
export const CELLS = SIZE * SIZE
export const CENTER = 12
export const MAX_NUMBER = 99
export const HEADERS = ['B', 'I', 'N', 'G', 'O']

export const idx = (row: number, col: number) => row * SIZE + col

function maskFrom(fn: (row: number, col: number) => boolean): boolean[] {
  return Array.from({ length: CELLS }, (_, i) => fn(Math.floor(i / SIZE), i % SIZE))
}

export const emptyMask = () => Array<boolean>(CELLS).fill(false)

export const BUILTIN_PATTERNS: Pattern[] = [
  { id: 'U', name: 'U', builtin: true, mask: maskFrom((r, c) => c === 0 || c === 4 || r === 4) },
  { id: 'T', name: 'T', builtin: true, mask: maskFrom((r, c) => r === 0 || c === 2) },
  { id: 'E', name: 'E', builtin: true, mask: maskFrom((r, c) => c === 0 || r === 0 || r === 2 || r === 4) },
  { id: 'C', name: 'C', builtin: true, mask: maskFrom((r, c) => c === 0 || r === 0 || r === 4) },
]
