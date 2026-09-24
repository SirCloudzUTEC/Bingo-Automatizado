import { useState } from 'react'
import type { ColumnRule } from '../types'
import { canSetColumnRule } from '../lib/guards'
import { DEFAULT_COLUMN_RULE, HEADERS } from '../lib/patterns'
import { useBingoStore } from '../store/useBingoStore'
import { Button, Modal } from './ui'

/** Muestra la regla de columnas activa y permite activarla, desactivarla o modificarla. */
export function ColumnRulePanel() {
  const rule = useBingoStore((s) => s.columnRule)
  const setColumnRule = useBingoStore((s) => s.setColumnRule)
  const [editing, setEditing] = useState(false)

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-line">
      <div className="min-w-0 flex-1 basis-48">
        <h2 className="font-display text-lg font-semibold">Regla de columnas</h2>
        <p className="text-sm text-muted">
          {rule.enabled ? 'Cada columna solo acepta números de su rango.' : 'Desactivada: cualquier número puede ir en cualquier columna.'}
        </p>
      </div>
      <div className={`grid grid-cols-5 gap-1.5 transition ${rule.enabled ? '' : 'opacity-40'}`}>
        {HEADERS.map((h, c) => (
          <div key={h} className="flex min-w-14 flex-col items-center rounded-xl bg-surface-2 px-2 py-1">
            <span className="font-display text-lg font-bold text-brand">{h}</span>
            <span className="tabular text-xs font-semibold">
              {rule.ranges[c][0]}–{rule.ranges[c][1]}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={(e) => setColumnRule({ ...rule, enabled: e.target.checked })}
            className="size-4 accent-brand"
          />
          Activar
        </label>
        <Button size="sm" onClick={() => setEditing(true)}>
          Modificar
        </Button>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Regla de columnas">
        {editing && (
          <ColumnRuleEditor
            initial={rule}
            onCancel={() => setEditing(false)}
            onSave={(next) => {
              const res = setColumnRule(next)
              if (res.ok) setEditing(false)
              return res.ok ? undefined : res.reason
            }}
          />
        )}
      </Modal>
    </section>
  )
}

type EditorProps = {
  initial: ColumnRule
  onSave: (rule: ColumnRule) => string | void
  onCancel: () => void
}

function ColumnRuleEditor({ initial, onSave, onCancel }: EditorProps) {
  // se editan como texto para permitir borrar el campo mientras se escribe
  const [ranges, setRanges] = useState(() => initial.ranges.map(([a, b]) => [String(a), String(b)]))
  const [saveError, setSaveError] = useState<string | null>(null)
  const draft: ColumnRule = { enabled: true, ranges: ranges.map(([a, b]) => [a ? Number(a) : NaN, b ? Number(b) : NaN]) }
  const check = canSetColumnRule(draft)

  const setBound = (c: number, k: 0 | 1, raw: string) => {
    setSaveError(null)
    const v = raw.replace(/\D/g, '').slice(0, 2)
    setRanges((rs) => rs.map((r, i) => (i !== c ? r : k === 0 ? [v, r[1]] : [r[0], v])))
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (check.ok) setSaveError(onSave(draft) || null)
      }}
    >
      <p className="text-sm text-muted">Define qué números puede llevar cada columna. Las cartillas nuevas o editadas se validan con esta regla.</p>
      <div className="flex flex-col gap-2">
        {HEADERS.map((h, c) => (
          <div key={h} className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand font-display text-lg font-bold text-brand-ink">{h}</span>
            {([0, 1] as const).map((k) => (
              <input
                key={k}
                value={ranges[c][k]}
                onChange={(e) => setBound(c, k, e.target.value)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                aria-label={`${h} ${k === 0 ? 'mínimo' : 'máximo'}`}
                placeholder={k === 0 ? 'Mín' : 'Máx'}
                className="tabular h-10 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-center font-semibold outline-none focus:border-brand"
              />
            ))}
          </div>
        ))}
      </div>

      <div className="min-h-5 text-sm" aria-live="polite">
        {!check.ok && <p className="text-red-500">{check.reason}</p>}
        {saveError && <p className="text-red-500">No se pudo guardar: {saveError}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSaveError(null)
            setRanges(DEFAULT_COLUMN_RULE.ranges.map(([a, b]) => [String(a), String(b)]))
          }}
        >
          Restaurar 1–75
        </Button>
        <div className="flex-1" />
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!check.ok}>
          Guardar regla
        </Button>
      </div>
    </form>
  )
}
