import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PatternEditor } from '../components/PatternEditor'
import { PatternPreview } from '../components/PatternPreview'
import { Button, ConfirmButton, Modal } from '../components/ui'
import { canRemovePattern, canStartRound } from '../lib/guards'
import { formatPrize } from '../lib/patterns'
import type { Pattern } from '../types'
import { allPatterns, useBingoStore } from '../store/useBingoStore'

export function LetterPage() {
  const { customPatterns, savePattern, removePattern, startRound, round, cards } = useBingoStore()
  const patterns = allPatterns(customPatterns)
  const [selected, setSelected] = useState(round?.patternId ?? 'U')
  const [editing, setEditing] = useState<Pattern | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const selectedPattern = patterns.find((p) => p.id === selected)
  const startCheck = canStartRound(selectedPattern, cards)

  const start = () => {
    const res = startRound(selected)
    if (!res.ok) return setError(res.reason)
    navigate('/play')
  }

  return (
    <main className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold">¿Qué letra se busca formar?</h1>
        <p className="text-muted">Elige la figura de esta ronda. Puedes crear tus propias figuras.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {patterns.map((p) => {
          const active = p.id === selected
          return (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelected(p.id)
                setError(null)
              }}
              onDoubleClick={() => startCheck.ok && start()}
              aria-pressed={active}
              className={`group relative flex flex-col items-center gap-3 rounded-3xl bg-surface p-4 shadow-sm ring-2 transition ${active ? 'ring-brand' : 'ring-transparent hover:ring-line'}`}
            >
              <span className={`font-display font-bold ${p.name.length > 3 ? 'text-3xl leading-10' : 'text-4xl'} ${active ? 'text-brand' : ''}`}>{p.name}</span>
              <div className="w-full max-w-28">
                <PatternPreview mask={p.mask} />
              </div>
              {p.prize != null && (
                <span className="tabular rounded-full bg-hit/15 px-3 py-1 font-display text-lg font-bold text-hit">{formatPrize(p.prize)}</span>
              )}
              {!p.builtin && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditing(p)
                  }}
                  className="absolute right-2 top-2 rounded-lg px-2 py-0.5 text-xs text-muted hover:bg-surface-2"
                >
                  Editar
                </span>
              )}
            </motion.button>
          )
        })}
        <button
          onClick={() => setEditing('new')}
          className="flex min-h-40 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-dashed border-line text-muted transition hover:border-brand hover:text-brand"
        >
          <span className="text-3xl">＋</span>
          <span className="text-sm font-semibold">Crear figura</span>
        </button>
      </div>

      <div className="sticky bottom-4 flex flex-col items-center gap-2">
        {!startCheck.ok && (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-amber-400/15 px-4 py-3 text-center text-sm">
            <p className="font-medium text-amber-600 dark:text-amber-400">⚠ {startCheck.reason}</p>
            {cards.length === 0 && (
              <Button size="sm" variant="primary" onClick={() => navigate('/card/new')}>
                + Agregar cartilla
              </Button>
            )}
          </div>
        )}
        {error && startCheck.ok && <p className="text-sm text-red-500">{error}</p>}
        {round && <p className="text-sm text-muted">Hay una ronda en curso con {round.called.length} números; empezar otra reinicia el historial.</p>}
        <Button variant="primary" size="lg" className="w-full max-w-sm" onClick={start} disabled={!startCheck.ok}>
          {round ? 'Empezar nueva ronda' : 'Empezar ronda'} con “{selectedPattern?.name ?? '—'}”
        </Button>
        {round && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/play')}>
            Volver a la ronda actual
          </Button>
        )}
      </div>

      <Modal open={editing != null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nueva figura' : 'Editar figura'}>
        {editing != null && (
          <>
            <PatternEditor
              initialName={editing === 'new' ? '' : editing.name}
              initialMask={editing === 'new' ? undefined : editing.mask}
              patterns={patterns}
              editingId={editing === 'new' ? undefined : editing.id}
              onCancel={() => setEditing(null)}
              onSave={(name, mask) => {
                const res = savePattern(name, mask, editing === 'new' ? undefined : editing.id)
                if (!res.ok) return res.reason
                setSelected(res.id)
                setEditing(null)
              }}
            />
            {editing !== 'new' && canRemovePattern(editing, round).ok && (
              <div className="mt-3 flex justify-center">
                <ConfirmButton
                  onConfirm={() => {
                    if (!removePattern(editing.id).ok) return
                    if (selected === editing.id) setSelected('U')
                    setEditing(null)
                  }}
                >
                  Eliminar figura
                </ConfirmButton>
              </div>
            )}
          </>
        )}
      </Modal>
    </main>
  )
}
