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
  /** en móvil, oculta las teclas y deja solo la pantalla (toca para expandir) */
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export function appendDigit(buffer: string, d: string) {
  const next = buffer.length >= 2 ? d : buffer + d
  return Number(next) > MAX_NUMBER ? d : next.replace(/^0+(?=\d)/, '')
}

export function NumberPad({ value, onChange, onSubmit, disabled, captureKeys = true, collapsed, onToggleCollapsed }: Props) {
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

  const key = 'h-11 rounded-xl bg-surface-2 font-display text-2xl font-semibold transition active:scale-95 active:bg-line sm:h-14'
  const submitBtn = (
    <button
      type="button"
      disabled={disabled || !value}
      onClick={onSubmit}
      className="h-11 rounded-xl bg-brand px-4 font-display text-lg font-bold text-white shadow-md shadow-brand/30 transition active:scale-95 disabled:opacity-40 sm:h-14"
    >
      Cantar
    </button>
  )
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Mostrar teclado' : 'Ocultar teclado'}
          className="relative flex h-12 flex-1 items-center justify-center rounded-2xl bg-surface-2 font-display text-4xl font-bold tabular sm:h-16 sm:text-5xl lg:pointer-events-none"
          aria-live="polite"
        >
          {value ? (
            <motion.span key={value} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {value}
            </motion.span>
          ) : (
            <span className="text-xl font-medium text-muted sm:text-2xl">Número cantado</span>
          )}
          {onToggleCollapsed && <span className="absolute right-3 text-base text-muted lg:hidden">{collapsed ? '▲' : '▼'}</span>}
        </button>
        {collapsed && <div className="grid lg:hidden">{submitBtn}</div>}
      </div>
      <div className={`grid-cols-3 gap-2 ${collapsed ? 'hidden lg:grid' : 'grid'}`}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" disabled={disabled} className={`${key} disabled:opacity-40`} onClick={() => onChange(appendDigit(value, d))}>
            {d}
          </button>
        ))}
        <button type="button" disabled={disabled} className={`${key} text-xl text-muted disabled:opacity-40`} onClick={() => onChange(value.slice(0, -1))} aria-label="Borrar">
          ⌫
        </button>
        <button type="button" disabled={disabled} className={`${key} disabled:opacity-40`} onClick={() => onChange(appendDigit(value, '0'))}>
          0
        </button>
        {submitBtn}
      </div>
    </div>
  )
}
