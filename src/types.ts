export type Cell = { value: number | null; free?: boolean }

export type CardTheme = 'rose' | 'sky' | 'emerald' | 'violet' | 'amber' | 'slate'

export type Card = {
  id: string
  name: string
  theme: CardTheme
  /** 25 celdas, fila por fila (índice = fila * 5 + columna) */
  cells: Cell[]
  createdAt: number
}

export type Pattern = {
  id: string
  name: string
  /** 25 booleanos, fila por fila */
  mask: boolean[]
  builtin: boolean
  /** premio en soles al completar la figura */
  prize?: number
}

export type Round = {
  id: string
  patternId: string
  /** números cantados, en orden */
  called: number[]
  startedAt: number
}

/** [mínimo, máximo] permitido en una columna */
export type ColumnRange = [number, number]

/** Regla de columnas: un rango por columna B·I·N·G·O */
export type ColumnRule = {
  enabled: boolean
  ranges: ColumnRange[]
}
