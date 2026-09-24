import type { CardTheme } from '../types'

type ThemeClasses = {
  label: string
  swatch: string
  header: string
  mark: string
  soft: string
  ring: string
  text: string
}

// clases completas y literales para que Tailwind las detecte
export const THEMES: Record<CardTheme, ThemeClasses> = {
  rose: { label: 'Rosa', swatch: 'bg-rose-500', header: 'bg-rose-500 text-white', mark: 'bg-rose-500 text-white', soft: 'bg-rose-500/15', ring: 'ring-rose-500', text: 'text-rose-500' },
  sky: { label: 'Cielo', swatch: 'bg-sky-500', header: 'bg-sky-500 text-white', mark: 'bg-sky-500 text-white', soft: 'bg-sky-500/15', ring: 'ring-sky-500', text: 'text-sky-500' },
  emerald: { label: 'Esmeralda', swatch: 'bg-emerald-500', header: 'bg-emerald-600 text-white', mark: 'bg-emerald-600 text-white', soft: 'bg-emerald-500/15', ring: 'ring-emerald-500', text: 'text-emerald-500' },
  violet: { label: 'Violeta', swatch: 'bg-violet-500', header: 'bg-violet-500 text-white', mark: 'bg-violet-500 text-white', soft: 'bg-violet-500/15', ring: 'ring-violet-500', text: 'text-violet-500' },
  amber: { label: 'Ámbar', swatch: 'bg-amber-400', header: 'bg-amber-400 text-amber-950', mark: 'bg-amber-400 text-amber-950', soft: 'bg-amber-400/20', ring: 'ring-amber-400', text: 'text-amber-500' },
  slate: { label: 'Grafito', swatch: 'bg-slate-600', header: 'bg-slate-700 text-white', mark: 'bg-slate-700 text-white', soft: 'bg-slate-500/15', ring: 'ring-slate-500', text: 'text-slate-500' },
}

export const THEME_KEYS = Object.keys(THEMES) as CardTheme[]

export function nextTheme(count: number): CardTheme {
  return THEME_KEYS[count % THEME_KEYS.length]
}
