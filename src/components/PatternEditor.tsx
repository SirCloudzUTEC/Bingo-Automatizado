import { useState } from 'react'
import { CENTER, emptyMask } from '../lib/patterns'
import { PatternPreview } from './PatternPreview'
import { Button } from './ui'

type Props = {
  initialName?: string
  initialMask?: boolean[]
  onSave: (name: string, mask: boolean[]) => void
  onCancel: () => void
}

export function PatternEditor({ initialName = '', initialMask, onSave, onCancel }: Props) {
  const [name, setName] = useState(initialName)
  const [mask, setMask] = useState(() => initialMask ?? emptyMask())
  const count = mask.filter(Boolean).length
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim() && count > 0) onSave(name.trim(), mask)
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
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" className="flex-[2]" disabled={!name.trim() || count === 0}>
          Guardar figura
        </Button>
      </div>
    </form>
  )
}
