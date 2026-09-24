import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card, Pattern, Round } from '../types'
import { BUILTIN_PATTERNS } from '../lib/patterns'

type CardInput = Omit<Card, 'id' | 'createdAt'>

type State = {
  cards: Card[]
  customPatterns: Pattern[]
  round: Round | null
  saveCard: (card: CardInput, id?: string) => string
  removeCard: (id: string) => void
  duplicateCard: (id: string) => string | undefined
  savePattern: (name: string, mask: boolean[], id?: string) => string
  removePattern: (id: string) => void
  startRound: (patternId: string) => void
  endRound: () => void
  /** devuelve false si ya estaba cantado */
  callNumber: (n: number) => boolean
  undoLast: () => number | undefined
  uncall: (n: number) => void
}

export const useBingoStore = create<State>()(
  persist(
    (set, get) => ({
      cards: [],
      customPatterns: [],
      round: null,

      saveCard: (input, id) => {
        if (id && get().cards.some((c) => c.id === id)) {
          set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, ...input } : c)) }))
          return id
        }
        const card: Card = { ...input, id: nanoid(8), createdAt: Date.now() }
        set((s) => ({ cards: [...s.cards, card] }))
        return card.id
      },
      removeCard: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),
      duplicateCard: (id) => {
        const src = get().cards.find((c) => c.id === id)
        if (!src) return
        return get().saveCard({ ...src, name: `${src.name} (copia)`, cells: src.cells.map((c) => ({ ...c })) })
      },

      savePattern: (name, mask, id) => {
        if (id && get().customPatterns.some((p) => p.id === id)) {
          set((s) => ({ customPatterns: s.customPatterns.map((p) => (p.id === id ? { ...p, name, mask } : p)) }))
          return id
        }
        const p: Pattern = { id: nanoid(8), name, mask, builtin: false }
        set((s) => ({ customPatterns: [...s.customPatterns, p] }))
        return p.id
      },
      removePattern: (id) => set((s) => ({ customPatterns: s.customPatterns.filter((p) => p.id !== id) })),

      startRound: (patternId) => set({ round: { id: nanoid(8), patternId, called: [], startedAt: Date.now() } }),
      endRound: () => set({ round: null }),
      callNumber: (n) => {
        const round = get().round
        if (!round || round.called.includes(n)) return false
        set({ round: { ...round, called: [...round.called, n] } })
        return true
      },
      undoLast: () => {
        const round = get().round
        if (!round || round.called.length === 0) return
        const last = round.called[round.called.length - 1]
        set({ round: { ...round, called: round.called.slice(0, -1) } })
        return last
      },
      uncall: (n) => {
        const round = get().round
        if (round) set({ round: { ...round, called: round.called.filter((x) => x !== n) } })
      },
    }),
    { name: 'bingo-gemelo', version: 1 },
  ),
)

export const allPatterns = (custom: Pattern[]) => [...BUILTIN_PATTERNS, ...custom]

export function usePattern(id: string | undefined) {
  const custom = useBingoStore((s) => s.customPatterns)
  return allPatterns(custom).find((p) => p.id === id)
}
