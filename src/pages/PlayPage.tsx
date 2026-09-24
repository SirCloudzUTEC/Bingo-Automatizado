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
import { canCall } from '../lib/guards'
import { BUILTIN_PATTERNS, formatPrize } from '../lib/patterns'
import { THEMES, nextTheme } from '../lib/themes'
import { useBingoStore, usePattern } from '../store/useBingoStore'
import type { Card } from '../types'

type Toast = { id: number; tone: 'hit' | 'miss' | 'warn' | 'win'; title: string; detail?: string }

export function PlayPage() {
  const { cards, round, callNumber, undoLast, uncall, saveCard, columnRule } = useBingoStore()
  const roundPattern = usePattern(round?.patternId)
  // solo como respaldo para los hooks; si la figura no existe se redirige más abajo
  const pattern = roundPattern ?? BUILTIN_PATTERNS[0]
  const navigate = useNavigate()
  const [buffer, setBuffer] = useState('')
  const [toast, setToast] = useState<Toast | null>(null)
  const [editing, setEditing] = useState<Card | 'new' | null>(null)
  const [padCollapsed, setPadCollapsed] = useState(false)
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
      // validación en la UI y de nuevo dentro del store
      const check = canCall(n, round, cards, columnRule)
      const res = check.ok ? callNumber(n) : check
      if (!res.ok) return show({ tone: 'warn', title: 'No se puede cantar', detail: res.reason })
      const hits = hitsForNumber(index, pattern, n)
      const inside = hits.filter((h) => h.inPattern)
      const names = [...new Set(inside.map((h) => cardsById.get(h.cardId)?.name))]
      if (inside.length) show({ tone: 'hit', title: `${n} ✓ en ${names.length} cartilla${names.length > 1 ? 's' : ''}`, detail: names.join(', ') })
      else show({ tone: 'miss', title: `${n}`, detail: hits.length ? `Está en ${hits.length} cartilla(s), pero fuera de la ${pattern.name}` : 'No aparece en ninguna cartilla' })
    },
    [round, cards, columnRule, callNumber, index, pattern, cardsById, show],
  )

  const submit = useCallback(() => buffer && call(Number(buffer)), [buffer, call])
  const noCards = cards.length === 0

  if (!round || !roundPattern) return <Navigate to="/letter" replace />

  const onSaveCard = (draft: Omit<Card, 'id' | 'createdAt'>) => {
    const res = saveCard(draft, editing !== 'new' ? editing?.id : undefined)
    if (!res.ok) return res.reason
    setEditing(null)
    const ev = evaluateCard({ ...draft, id: res.id, createdAt: 0 }, pattern, calledSet)
    if (!ev.complete)
      show({ tone: 'hit', title: `${draft.name} guardada`, detail: `Ya tiene ${ev.marked.length}/${ev.total} de la ${pattern.name} con el historial` })
  }

  return (
    <main className={`grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:pb-4 ${padCollapsed ? 'pb-28' : 'pb-80'}`}>
      {/* Panel de control */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
        <div className="flex items-center gap-3 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-line">
          <div className="w-14 shrink-0">
            <PatternPreview mask={pattern.mask} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Buscando</p>
            <p className="font-display text-3xl font-bold leading-none text-brand">{pattern.name}</p>
            {pattern.prize != null && <p className="tabular mt-1 text-sm font-bold text-hit">Premio {formatPrize(pattern.prize)}</p>}
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/letter')}>
            Nueva ronda
          </Button>
        </div>

        {/* móvil: panel fijo inferior · escritorio: tarjeta en la barra lateral */}
        <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-3xl border-t border-line bg-surface/95 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] backdrop-blur lg:static lg:rounded-3xl lg:border-0 lg:bg-surface lg:p-4 lg:shadow-sm lg:ring-1 lg:ring-line">
          {noCards && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-amber-400/15 px-3 py-2 text-sm">
              <p className="flex-1 font-medium text-amber-600 dark:text-amber-400">⚠ Agrega una cartilla para poder cantar números</p>
              <Button size="sm" variant="primary" onClick={() => setEditing('new')}>
                + Cartilla
              </Button>
            </div>
          )}
          <NumberPad
            value={buffer}
            onChange={setBuffer}
            onSubmit={submit}
            disabled={noCards}
            captureKeys={editing == null && !noCards}
            collapsed={padCollapsed}
            onToggleCollapsed={() => setPadCollapsed((c) => !c)}
          />
          <div className={`mt-2 gap-2 ${padCollapsed ? 'hidden lg:flex' : 'flex'}`}>
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
          <CalledHistory called={called} relevant={relevant} onRemove={uncall} onCall={call} disabled={noCards} />
        </div>
      </aside>

      {/* Cartillas en vivo */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">
            Cartillas <span className="text-muted">({cards.length})</span>
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

        {/* ganadoras: sus nombres siempre a la vista, tocar lleva a la cartilla */}
        <AnimatePresence>
          {winners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center gap-2 rounded-3xl bg-hit p-3 text-white shadow-lg shadow-hit/30 sm:p-4"
              aria-live="polite"
            >
              <p className="font-display text-xl font-bold sm:text-2xl">
                🏆 ¡BINGO!{pattern.prize != null && <span className="tabular ml-2 opacity-90">{formatPrize(pattern.prize)}</span>}
              </p>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {winners.map((w) => (
                  <button
                    key={w.cardId}
                    onClick={() => document.getElementById(`card-${w.cardId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    className="rounded-full bg-white/20 px-3 py-1 font-display font-semibold transition hover:bg-white/30"
                  >
                    {cardsById.get(w.cardId)?.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
          {evals.map((ev) => {
            const card = cardsById.get(ev.cardId)!
            const t = THEMES[card.theme]
            const left = ev.total - ev.marked.length
            return (
              <motion.article
                key={card.id}
                id={`card-${card.id}`}
                layout
                animate={ev.complete ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300, scale: { duration: 0.6 } }}
                className={`relative flex flex-col gap-3 rounded-3xl p-3 sm:p-4 ${
                  ev.complete
                    ? 'col-span-2 bg-hit/10 shadow-xl shadow-hit/25 ring-4 ring-hit'
                    : 'bg-surface shadow-sm ring-2 ring-line max-sm:gap-2 max-sm:rounded-2xl max-sm:p-2'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`size-3 shrink-0 rounded-full ${t.swatch}`} />
                  {ev.complete ? (
                    <h3 className="flex flex-1 items-center gap-2 truncate font-display text-2xl font-bold text-hit sm:text-3xl">
                      <span className="truncate">{card.name}</span>
                      <span className="shrink-0 rounded-full bg-hit px-2.5 py-0.5 text-sm text-white">🏆 BINGO</span>
                    </h3>
                  ) : (
                    <h3 className="flex-1 truncate font-display text-sm font-semibold sm:text-lg">{card.name}</h3>
                  )}
                  <button onClick={() => setEditing(card)} className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink">
                    Editar
                  </button>
                </div>
                <div className={ev.complete ? 'mx-auto w-full max-w-md' : ''}>
                  <CardGrid card={card} mask={pattern.mask} called={calledSet} lastCalled={lastCalled} compact={!ev.complete} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      className={`h-full rounded-full ${ev.complete ? 'bg-hit' : t.swatch}`}
                      animate={{ width: `${(ev.marked.length / ev.total) * 100}%` }}
                    />
                  </div>
                  {ev.complete ? (
                    <p className="text-center font-display text-2xl font-bold text-hit sm:text-3xl">¡{card.name} completó la {pattern.name}! 🎉</p>
                  ) : (
                    <p className="text-xs sm:text-sm">
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
            editingId={editing === 'new' ? undefined : editing.id}
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
