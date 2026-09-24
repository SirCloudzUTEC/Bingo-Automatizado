import { useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import type { Card, CardTheme, Cell } from '../types'
import { emptyCells, isCardValid, validateCard } from '../lib/bingo'
import { parseNumbers, type ParseOrder } from '../lib/parse'
import { CELLS, CENTER, HEADERS, MAX_NUMBER, SIZE } from '../lib/patterns'
import { THEMES, THEME_KEYS } from '../lib/themes'
import { Button } from './ui'

export type CardDraft = Omit<Card, 'id' | 'createdAt'>

type Props = {
  initial?: CardDraft
  defaultName: string
  defaultTheme: CardTheme
  onSave: (draft: CardDraft) => void
  onCancel: () => void
}

/** orden de recorrido de celdas (índices fila*5+col) */
const orderOf = (o: ParseOrder) =>
  Array.from({ length: CELLS }, (_, k) => (o === 'rows' ? k : (k % SIZE) * SIZE + Math.floor(k / SIZE)))

export function CardEditor({ initial, defaultName, defaultTheme, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? defaultName)
  const [theme, setTheme] = useState<CardTheme>(initial?.theme ?? defaultTheme)
  const [cells, setCells] = useState<Cell[]>(() => initial?.cells.map((c) => ({ ...c })) ?? emptyCells(true))
  const [order, setOrder] = useState<ParseOrder>('columns')
  const [bulk, setBulk] = useState<string | null>(null)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const freeCenter = !!cells[CENTER].free
  const issues = useMemo(() => validateCard(cells), [cells])
  const valid = isCardValid(cells)
  const filled = cells.filter((c) => c.free || c.value != null).length
  const seq = useMemo(() => orderOf(order).filter((i) => !cells[i].free), [order, cells])

  const focus = (i: number | undefined) => {
    if (i == null) return
    const el = inputs.current[i]
    el?.focus()
    el?.select()
  }
  const step = (i: number, dir: 1 | -1) => focus(seq[seq.indexOf(i) + dir])

  const setValue = (i: number, value: number | null) =>
    setCells((cs) => cs.map((c, k) => (k === i ? { value } : c)))

  const onInput = (i: number, raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2)
    setValue(i, digits ? Number(digits) : null)
    // auto-avance: 2 dígitos, o 1 dígito que no puede crecer dentro del rango
    if (digits.length === 2 || (digits.length === 1 && Number(digits) * 10 > MAX_NUMBER)) step(i, 1)
  }

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    const row = Math.floor(i / SIZE)
    const col = i % SIZE
    const move = (r: number, c: number) => {
      e.preventDefault()
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return
      let j = r * SIZE + c
      if (cells[j].free) j += j - i // saltar el centro libre
      if (j >= 0 && j < CELLS) focus(j)
    }
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        return step(i, 1)
      case 'Backspace':
        if (cells[i].value == null) {
          e.preventDefault()
          step(i, -1)
        }
        return
      case 'ArrowUp':
        return move(row - 1, col)
      case 'ArrowDown':
        return move(row + 1, col)
      case 'ArrowLeft':
        return move(row, col - 1)
      case 'ArrowRight':
        return move(row, col + 1)
    }
  }

  // pegar varios números en una celda llena desde ahí en el orden actual
  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const nums = (e.clipboardData.getData('text').match(/\d+/g) ?? []).map(Number)
    if (nums.length < 2) return
    e.preventDefault()
    const targets = seq.slice(seq.indexOf(i))
    setCells((cs) => {
      const next = cs.map((c) => ({ ...c }))
      targets.forEach((t, k) => k < nums.length && (next[t] = { value: nums[k] }))
      return next
    })
    focus(targets[Math.min(nums.length, targets.length - 1)])
  }

  const toggleFree = () =>
    setCells((cs) => cs.map((c, k) => (k === CENTER ? (c.free ? { value: null } : { value: null, free: true }) : c)))

  const applyBulk = () => {
    const parsed = parseNumbers(bulk ?? '', order, freeCenter)
    if (parsed) {
      setCells(parsed)
      setBulk(null)
    }
  }
  const bulkCount = (bulk?.match(/\d+/g) ?? []).length

  const t = THEMES[theme]

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onSave({ name: name.trim() || defaultName, theme, cells })
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la cartilla"
          aria-label="Nombre de la cartilla"
          className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 font-semibold outline-none focus:border-brand"
        />
        <div className="flex gap-1.5" role="radiogroup" aria-label="Diseño">
          {THEME_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={theme === k}
              aria-label={THEMES[k].label}
              onClick={() => setTheme(k)}
              className={`size-7 rounded-full transition ${THEMES[k].swatch} ${theme === k ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface ' + THEMES[k].ring : 'opacity-70 hover:opacity-100'}`}
            />
          ))}
        </div>
      </div>

      <div className={`mx-auto w-full max-w-sm rounded-2xl p-2 ring-2 ${t.ring} ${t.soft}`}>
        <div className="grid grid-cols-5 gap-1.5">
          {HEADERS.map((h) => (
            <div key={h} className={`rounded-lg py-1 text-center font-display text-lg font-bold ${t.header}`}>
              {h}
            </div>
          ))}
          {cells.map((cell, i) =>
            cell.free ? (
              <button
                key={i}
                type="button"
                onClick={toggleFree}
                title="Centro libre (toca para desactivar)"
                className={`flex aspect-square items-center justify-center rounded-lg text-2xl ${t.mark}`}
              >
                ★
              </button>
            ) : (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el
                }}
                value={cell.value ?? ''}
                onChange={(e) => onInput(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                onPaste={(e) => onPaste(i, e)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                enterKeyHint="next"
                autoComplete="off"
                aria-label={`${HEADERS[i % SIZE]} fila ${Math.floor(i / SIZE) + 1}`}
                className={`tabular aspect-square w-full min-w-0 rounded-lg border-2 bg-surface text-center text-xl font-semibold outline-none transition focus:scale-105 focus:border-brand ${
                  cell.value != null && (issues.duplicates.has(cell.value) || issues.outOfRange.includes(i))
                    ? 'border-red-500 bg-red-500/10 text-red-600'
                    : 'border-transparent'
                }`}
              />
            ),
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted">Avanzar por</span>
          <div className="flex rounded-lg bg-surface-2 p-0.5">
            {(['columns', 'rows'] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOrder(o)}
                className={`rounded-md px-2.5 py-1 font-medium transition ${order === o ? 'bg-surface shadow-sm' : 'text-muted'}`}
              >
                {o === 'columns' ? 'Columnas' : 'Filas'}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={freeCenter} onChange={toggleFree} className="size-4 accent-brand" />
          Centro libre
        </label>
      </div>

      {bulk == null ? (
        <button type="button" onClick={() => setBulk('')} className="self-start text-sm font-medium text-brand hover:underline">
          ⌨ Escribir o pegar todos los números de una vez
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={3}
            placeholder={`Ej: 3 12 7 1 15 ... (${freeCenter ? '24' : '25'} números, por ${order === 'columns' ? 'columnas B→O' : 'filas'})`}
            className="rounded-xl border border-line bg-surface p-3 outline-none focus:border-brand"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">{bulkCount} números</span>
            <div className="flex-1" />
            <Button type="button" size="sm" variant="ghost" onClick={() => setBulk(null)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" variant="primary" onClick={applyBulk} disabled={parseNumbers(bulk, order, freeCenter) == null}>
              Aplicar
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-5 text-sm" aria-live="polite">
        {issues.duplicates.size > 0 && <p className="text-red-500">Números repetidos: {[...issues.duplicates].join(', ')}</p>}
        {issues.outOfRange.length > 0 && <p className="text-red-500">Solo se permiten números del 1 al {MAX_NUMBER}</p>}
        {issues.empty.length > 0 && issues.duplicates.size === 0 && (
          <p className="text-muted">
            {filled}/{CELLS} celdas completas
          </p>
        )}
        {valid && <p className="text-hit">✓ Cartilla lista</p>}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!valid} className="flex-[2]">
          Guardar cartilla
        </Button>
      </div>
    </form>
  )
}
