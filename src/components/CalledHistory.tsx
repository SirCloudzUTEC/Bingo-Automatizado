import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { MAX_NUMBER } from '../lib/patterns'

type Props = {
  called: number[]
  /** números que aparecen dentro de la letra en alguna cartilla */
  relevant: Set<number>
  onRemove: (n: number) => void
  onCall: (n: number) => void
}

export function CalledHistory({ called, relevant, onRemove, onCall }: Props) {
  const [armed, setArmed] = useState<number | null>(null)
  const [board, setBoard] = useState(false)
  const calledSet = new Set(called)
  const recentFirst = [...called].reverse()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted">Historial · {called.length}</h3>
        <button onClick={() => setBoard((b) => !b)} className="text-sm font-medium text-brand hover:underline">
          {board ? 'Ocultar tablero' : `Tablero 1–${MAX_NUMBER}`}
        </button>
      </div>

      {called.length === 0 ? (
        <p className="text-sm text-muted">Aún no se canta ningún número.</p>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
          <AnimatePresence initial={false}>
            {recentFirst.map((n, i) => (
              <motion.button
                key={n}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => (armed === n ? (onRemove(n), setArmed(null)) : setArmed(n))}
                onBlur={() => setArmed(null)}
                title="Toca dos veces para quitarlo"
                className={`tabular grid h-9 min-w-9 shrink-0 place-items-center rounded-full px-2 text-sm font-bold transition ${
                  armed === n
                    ? 'bg-red-500 text-white'
                    : i === 0
                      ? 'bg-brand text-white ring-4 ring-brand/25'
                      : relevant.has(n)
                        ? 'bg-hit/15 text-hit'
                        : 'bg-surface-2 text-muted'
                }`}
              >
                {armed === n ? '✕' : n}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {board && (
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: MAX_NUMBER }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              disabled={calledSet.has(n)}
              onClick={() => onCall(n)}
              className={`tabular aspect-square rounded-md text-xs font-semibold transition ${
                calledSet.has(n) ? 'bg-brand text-white' : 'bg-surface-2 text-muted hover:bg-line hover:text-ink'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
