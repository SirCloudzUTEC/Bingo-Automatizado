import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { MAX_NUMBER } from '../lib/patterns'

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
  /** captura el teclado físico (se desactiva cuando hay un modal abierto) */
  captureKeys?: boolean
}

export function appendDigit(buffer: string, d: string) {
  const next = buffer.length >= 2 ? d : buffer + d
  return Number(next) > MAX_NUMBER ? d : next.replace(/^0+(?=\d)/, '')
}

export function NumberPad({ value, onChange, onSubmit, disabled, captureKeys = true }: Props) {
  useEffect(() => {
    if (!captureKeys) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return
      if (/^\d$/.test(e.key)) onChange(appendDigit(value, e.key))
      else if (e.key === 'Backspace') onChange(value.slice(0, -1))
      else if (e.key === 'Escape') onChange('')
      else if (e.key === 'Enter') {
        e.preventDefault()
        onSubmit()
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [value, onChange, onSubmit, captureKeys])

  const key = 'h-12 rounded-xl bg-surface-2 font-display text-2xl font-semibold transition active:scale-95 active:bg-line sm:h-14'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-16 items-center justify-center rounded-2xl bg-surface-2 font-display text-5xl font-bold tabular" aria-live="polite">
        {value ? (
          <motion.span key={value} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {value}
          </motion.span>
        ) : (
          <span className="text-2xl font-medium text-muted">Número cantado</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className={key} onClick={() => onChange(appendDigit(value, d))}>
            {d}
          </button>
        ))}
        <button type="button" className={`${key} text-xl text-muted`} onClick={() => onChange(value.slice(0, -1))} aria-label="Borrar">
          ⌫
        </button>
        <button type="button" className={key} onClick={() => onChange(appendDigit(value, '0'))}>
          0
        </button>
        <button
          type="button"
          disabled={disabled || !value}
          onClick={onSubmit}
          className="h-12 rounded-xl bg-brand font-display text-lg font-bold text-white shadow-md shadow-brand/30 transition active:scale-95 disabled:opacity-40 sm:h-14"
        >
          Cantar
        </button>
      </div>
    </div>
  )
}
