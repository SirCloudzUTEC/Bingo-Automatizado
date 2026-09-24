import { motion } from 'framer-motion'
import { memo } from 'react'
import type { Card } from '../types'
import { HEADERS } from '../lib/patterns'
import { THEMES } from '../lib/themes'

type Props = {
  card: Pick<Card, 'cells' | 'theme'>
  /** celdas de la letra a resaltar */
  mask?: boolean[]
  called?: Set<number>
  lastCalled?: number
  compact?: boolean
}

export const CardGrid = memo(function CardGrid({ card, mask, called, lastCalled, compact }: Props) {
  const t = THEMES[card.theme]
  const text = compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'
  return (
    <div className="grid grid-cols-5 gap-1">
      {HEADERS.map((h) => (
        <div key={h} className={`rounded-md py-0.5 text-center font-display font-bold ${t.header} ${compact ? 'text-xs' : 'text-sm'}`}>
          {h}
        </div>
      ))}
      {card.cells.map((cell, i) => {
        const inMask = mask?.[i] ?? false
        const marked = cell.free || (cell.value != null && !!called?.has(cell.value))
        const isLast = cell.value != null && cell.value === lastCalled
        let cls = 'bg-surface-2 text-ink'
        if (inMask && marked) cls = `${t.mark} shadow-sm`
        else if (inMask) cls = `${t.soft} text-ink ring-1 ring-inset ${t.ring}`
        else if (marked) cls = 'bg-surface-2 text-muted/60 line-through'
        else if (mask) cls = 'bg-surface-2 text-muted'
        return (
          <motion.div
            key={i}
            aria-label={cell.free ? 'Libre' : `${cell.value ?? 'vacío'}${marked ? ', marcado' : ''}`}
            className={`tabular relative flex aspect-square items-center justify-center rounded-lg font-semibold transition-colors ${text} ${cls}`}
            animate={isLast ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={{ duration: 0.45 }}
          >
            {cell.free ? '★' : (cell.value ?? '·')}
            {isLast && <span className={`absolute inset-0 animate-ping rounded-lg ring-2 ${t.ring}`} />}
          </motion.div>
        )
      })}
    </div>
  )
})
