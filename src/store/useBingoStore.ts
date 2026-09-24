import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card, ColumnRule, Pattern, Round } from '../types'
import { BUILTIN_PATTERNS, DEFAULT_COLUMN_RULE } from '../lib/patterns'
import { canCall, canRemovePattern, canSaveCard, canSavePattern, canSetColumnRule, canStartRound, sanitizeState, type Check } from '../lib/guards'

type CardInput = Omit<Card, 'id' | 'createdAt'>
export type SaveResult = { ok: true; id: string } | { ok: false; reason: string }

type State = {
  cards: Card[]
  customPatterns: Pattern[]
  round: Round | null
  columnRule: ColumnRule
  setColumnRule: (rule: ColumnRule) => Check
  saveCard: (card: CardInput, id?: string) => SaveResult
  removeCard: (id: string) => void
  savePattern: (name: string, mask: boolean[], id?: string) => SaveResult
  removePattern: (id: string) => Check
  startRound: (patternId: string) => Check
  endRound: () => void
  callNumber: (n: number) => Check
  undoLast: () => number | undefined
  uncall: (n: number) => void
}

export const allPatterns = (custom: Pattern[]) => [...BUILTIN_PATTERNS, ...custom]

export const useBingoStore = create<State>()(
  persist(
    (set, get) => ({
      cards: [],
      customPatterns: [],
      round: null,
      columnRule: DEFAULT_COLUMN_RULE,

      setColumnRule: (rule) => {
        const check = canSetColumnRule(rule)
        if (check.ok) set({ columnRule: { enabled: rule.enabled, ranges: rule.ranges.map(([a, b]) => [a, b]) } })
        return check
      },
      // Cada acción revalida con las mismas reglas que usa la UI (lib/guards).
      saveCard: (input, id) => {
        const existing = id ? get().cards.find((c) => c.id === id) : undefined
        const check = canSaveCard(input.cells, get().cards, existing?.id, get().columnRule)
        if (!check.ok) return check
        if (existing) {
          set((s) => ({ cards: s.cards.map((c) => (c.id === existing.id ? { ...c, ...input } : c)) }))
          return { ok: true, id: existing.id }
        }
        const card: Card = { ...input, id: nanoid(8), createdAt: Date.now() }
        set((s) => ({ cards: [...s.cards, card] }))
        return { ok: true, id: card.id }
      },
      removeCard: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),
      savePattern: (name, mask, id) => {
        const existing = id ? get().customPatterns.find((p) => p.id === id) : undefined
        const check = canSavePattern(name, mask, allPatterns(get().customPatterns), existing?.id)
        if (!check.ok) return check
        if (existing) {
          set((s) => ({ customPatterns: s.customPatterns.map((p) => (p.id === existing.id ? { ...p, name: name.trim(), mask } : p)) }))
          return { ok: true, id: existing.id }
        }
        const p: Pattern = { id: nanoid(8), name: name.trim(), mask, builtin: false }
        set((s) => ({ customPatterns: [...s.customPatterns, p] }))
        return { ok: true, id: p.id }
      },
      removePattern: (id) => {
        const check = canRemovePattern(get().customPatterns.find((p) => p.id === id), get().round)
        if (check.ok) set((s) => ({ customPatterns: s.customPatterns.filter((p) => p.id !== id) }))
        return check
      },

      startRound: (patternId) => {
        const pattern = allPatterns(get().customPatterns).find((p) => p.id === patternId)
        const check = canStartRound(pattern, get().cards)
        if (check.ok) set({ round: { id: nanoid(8), patternId, called: [], startedAt: Date.now() } })
        return check
      },
      endRound: () => set({ round: null }),
      callNumber: (n) => {
        const { round, cards, columnRule } = get()
        const check = canCall(n, round, cards, columnRule)
        if (check.ok) set({ round: { ...round!, called: [...round!.called, n] } })
        return check
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
        if (round?.called.includes(n)) set({ round: { ...round, called: round.called.filter((x) => x !== n) } })
      },
    }),
    {
      name: 'bingo-gemelo',
      version: 1,
      partialize: ({ cards, customPatterns, round, columnRule }) => ({ cards, customPatterns, round, columnRule }),
      // si localStorage trae datos corruptos o editados a mano, se descartan en vez de romper la app
      merge: (persisted, current) => ({ ...current, ...sanitizeState((persisted ?? {}) as object, BUILTIN_PATTERNS) }),
    },
  ),
)

export function usePattern(id: string | undefined) {
  const custom = useBingoStore((s) => s.customPatterns)
  return allPatterns(custom).find((p) => p.id === id)
}
