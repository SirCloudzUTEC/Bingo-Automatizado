import { useState } from 'react'
import { canSavePattern } from '../lib/guards'
import type { Pattern } from '../types'
import { CENTER, emptyMask } from '../lib/patterns'
import { PatternPreview } from './PatternPreview'
import { Button } from './ui'

type Props = {
  initialName?: string
  initialMask?: boolean[]
  /** todas las figuras existentes, para evitar nombres repetidos */
  patterns: Pattern[]
  editingId?: string
  /** devuelve un motivo si el store rechaza el guardado */
  onSave: (name: string, mask: boolean[]) => string | void
  onCancel: () => void
}

export function PatternEditor({ initialName = '', initialMask, patterns, editingId, onSave, onCancel }: Props) {
  const [name, setName] = useState(initialName)
  const [mask, setMask] = useState(() => initialMask ?? emptyMask())
  const [saveError, setSaveError] = useState<string | null>(null)
  const count = mask.filter(Boolean).length
  const check = canSavePattern(name, mask, patterns, editingId)
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (check.ok) setSaveError(onSave(name.trim(), mask) || null)
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 12))}
        placeholder="Nombre (ej: L, X, Cruz)"
        aria-label="Nombre de la figura"
        className="h-11 rounded-xl border border-line bg-surface px-3 font-display text-lg font-semibold outline-none focus:border-brand"
      />
      <p className="text-sm text-muted">Toca las celdas que forman la figura. La celda central es el espacio libre si la cartilla lo tiene.</p>
      <div className="mx-auto w-full max-w-64">
        <PatternPreview mask={mask} size="lg" onToggle={(i) => setMask((m) => m.map((v, k) => (k === i ? !v : v)))} />
      </div>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          {count} celdas {mask[CENTER] && '· incluye centro'}
        </span>
        <button type="button" className="font-medium text-brand hover:underline" onClick={() => setMask(emptyMask())}>
          Limpiar
        </button>
      </div>
      {!check.ok && (name.trim() || count > 0) && <p className="text-sm text-amber-500">⚠ {check.reason}</p>}
      {saveError && <p className="text-sm text-red-500">No se pudo guardar: {saveError}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="flex-[2]" disabled={!check.ok}>
          Guardar figura
        </Button>
      </div>
    </form>
  )
}
