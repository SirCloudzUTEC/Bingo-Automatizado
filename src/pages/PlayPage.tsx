import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CalledHistory } from '../components/CalledHistory'
import { CardEditor } from '../components/CardEditor'
import { CardGrid } from '../components/CardGrid'
import { NumberPad } from '../components/NumberPad'
import { PatternPreview } from '../components/PatternPreview'
import { Button, Modal } from '../components/ui'
import { buildIndex, evaluateAll, evaluateCard, hitsForNumber } from '../lib/bingo'
import { BUILTIN_PATTERNS, MAX_NUMBER } from '../lib/patterns'
import { THEMES, nextTheme } from '../lib/themes'
import { useBingoStore, usePattern } from '../store/useBingoStore'
import type { Card } from '../types'

type Toast = { id: number; tone: 'hit' | 'miss' | 'warn' | 'win'; title: string; detail?: string }

export function PlayPage() {
  const { cards, round, callNumber, undoLast, uncall, saveCard } = useBingoStore()
  const pattern = usePattern(round?.patternId) ?? BUILTIN_PATTERNS[0]
  const navigate = useNavigate()
  const [buffer, setBuffer] = useState('')
  const [toast, setToast] = useState<Toast | null>(null)
  const [editing, setEditing] = useState<Card | 'new' | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const called = round?.called ?? []
  const calledSet = useMemo(() => new Set(called), [called])
  const index = useMemo(() => buildIndex(cards), [cards])
  const evals = useMemo(() => evaluateAll(cards, pattern, called), [cards, pattern, called])
  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])
  const relevant = useMemo(() => new Set(called.filter((n) => hitsForNumber(index, pattern, n).some((h) => h.inPattern))), [called, index, pattern])
  const winners = evals.filter((e) => e.complete)
  const lastCalled = called.at(-1)

  const show = useCallback((t: Omit<Toast, 'id'>) => {
    clearTimeout(toastTimer.current)
    setToast({ ...t, id: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), t.tone === 'win' ? 5000 : 2800)
  }, [])

  // detecta cartillas que acaban de completar la letra (al cantar o al agregar/editar)
  const prevWinners = useRef<Set<string> | null>(null)
  useEffect(() => {
    const now = new Set(winners.map((w) => w.cardId))
    const prev = prevWinners.current
    prevWinners.current = now
    if (!prev) return
    const fresh = [...now].filter((id) => !prev.has(id))
    if (fresh.length === 0) return
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } })
    show({ tone: 'win', title: '¡BINGO!', detail: fresh.map((id) => cardsById.get(id)?.name).join(', ') + ` completó la ${pattern.name}` })
  }, [winners, cardsById, pattern.name, show])

  const call = useCallback(
    (n: number) => {
      setBuffer('')
      if (!Number.isInteger(n) || n < 1 || n > MAX_NUMBER) return show({ tone: 'warn', title: `Número inválido`, detail: `Debe estar entre 1 y ${MAX_NUMBER}` })
      if (!callNumber(n)) return show({ tone: 'warn', title: `${n} ya fue cantado` })
      const hits = hitsForNumber(index, pattern, n)
      const inside = hits.filter((h) => h.inPattern)
      const names = [...new Set(inside.map((h) => cardsById.get(h.cardId)?.name))]
      if (inside.length) show({ tone: 'hit', title: `${n} ✓ en ${names.length} cartilla${names.length > 1 ? 's' : ''}`, detail: names.join(', ') })
      else show({ tone: 'miss', title: `${n}`, detail: hits.length ? `Está en ${hits.length} cartilla(s), pero fuera de la ${pattern.name}` : 'No aparece en ninguna cartilla' })
    },
    [callNumber, index, pattern, cardsById, show],
  )

  const submit = useCallback(() => buffer && call(Number(buffer)), [buffer, call])

  if (!round) return <Navigate to="/letter" replace />

  const onSaveCard = (draft: Omit<Card, 'id' | 'createdAt'>) => {
    const id = saveCard(draft, editing !== 'new' ? editing?.id : undefined)
    setEditing(null)
    const ev = evaluateCard({ ...draft, id, createdAt: 0 }, pattern, calledSet)
    if (!ev.complete)
      show({ tone: 'hit', title: `${draft.name} guardada`, detail: `Ya tiene ${ev.marked.length}/${ev.total} de la ${pattern.name} con el historial` })
  }

  return (
    <main className="grid gap-5 pb-4 lg:grid-cols-[340px_1fr] lg:items-start">
      {/* Panel de control */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
        <div className="flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-line">
          <div className="w-14 shrink-0">
            <PatternPreview mask={pattern.mask} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Buscando</p>
            <p className="font-display text-3xl font-bold leading-none text-brand">{pattern.name}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/letter')}>
            Nueva ronda
          </Button>
        </div>

        <div className="order-last rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-line lg:order-none">
          <NumberPad value={buffer} onChange={setBuffer} onSubmit={submit} captureKeys={editing == null} />
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1"
              disabled={!called.length}
              onClick={() => {
                const n = undoLast()
                if (n != null) show({ tone: 'warn', title: `Se deshizo el ${n}` })
              }}
            >
              ↶ Deshacer último
            </Button>
          </div>
        </div>

        <div className="rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-line">
          <CalledHistory called={called} relevant={relevant} onRemove={uncall} onCall={call} />
        </div>
      </aside>

      {/* Cartillas en vivo */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">
            Cartillas <span className="text-muted">({cards.length})</span>
            {winners.length > 0 && <span className="ml-2 rounded-full bg-hit px-2.5 py-0.5 align-middle text-sm text-white">{winners.length} con BINGO</span>}
          </h2>
          <Button size="sm" variant="primary" onClick={() => setEditing('new')}>
            + Agregar cartilla
          </Button>
        </div>

        {cards.length === 0 && (
          <button
            onClick={() => setEditing('new')}
            className="rounded-3xl border-2 border-dashed border-line py-16 text-muted transition hover:border-brand hover:text-brand"
          >
            Agrega una cartilla: se revisará con los {called.length} números ya cantados
          </button>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {evals.map((ev) => {
            const card = cardsById.get(ev.cardId)!
            const t = THEMES[card.theme]
            const left = ev.total - ev.marked.length
            return (
              <motion.article
                key={card.id}
                layout
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className={`relative flex flex-col gap-3 rounded-3xl bg-surface p-3 shadow-sm ring-2 sm:p-4 ${ev.complete ? 'ring-hit shadow-lg shadow-hit/20' : 'ring-line'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`size-3 shrink-0 rounded-full ${t.swatch}`} />
                  <h3 className="flex-1 truncate font-display text-lg font-semibold">{card.name}</h3>
                  <button onClick={() => setEditing(card)} className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink">
                    Editar
                  </button>
                </div>
                <CardGrid card={card} mask={pattern.mask} called={calledSet} lastCalled={lastCalled} compact />
                <div className="flex flex-col gap-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      className={`h-full rounded-full ${ev.complete ? 'bg-hit' : t.swatch}`}
                      animate={{ width: `${(ev.marked.length / ev.total) * 100}%` }}
                    />
                  </div>
                  {ev.complete ? (
                    <p className="text-center font-display text-2xl font-bold text-hit">¡BINGO! 🎉</p>
                  ) : (
                    <p className="text-sm">
                      <span className="font-semibold">
                        Faltan {left}
                      </span>
                      {ev.missing.length > 0 && (
                        <span className="text-muted">
                          : {ev.missing.slice(0, 10).join(' · ')}
                          {ev.missing.length > 10 && '…'}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </motion.article>
            )
          })}
        </div>
      </section>

      {/* Toast */}
      <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center px-4">
        <AnimatePresence mode="popLayout">
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ y: -30, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`max-w-md rounded-2xl px-5 py-3 text-center shadow-xl ${
                {
                  hit: 'bg-hit text-white',
                  miss: 'bg-surface text-ink ring-1 ring-line',
                  warn: 'bg-amber-400 text-amber-950',
                  win: 'bg-brand text-white text-lg',
                }[toast.tone]
              }`}
            >
              <p className={`font-display font-bold ${toast.tone === 'win' ? 'text-3xl' : 'text-xl'}`}>{toast.title}</p>
              {toast.detail && <p className="text-sm opacity-90">{toast.detail}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal open={editing != null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Agregar cartilla' : 'Editar cartilla'}>
        {editing != null && (
          <CardEditor
            initial={editing === 'new' ? undefined : editing}
            defaultName={`Cartilla ${cards.length + 1}`}
            defaultTheme={nextTheme(cards.length)}
            onCancel={() => setEditing(null)}
            onSave={onSaveCard}
          />
        )}
      </Modal>
    </main>
  )
}
