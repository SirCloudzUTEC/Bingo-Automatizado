import { NavLink, Outlet } from 'react-router-dom'
import { useBingoStore } from '../store/useBingoStore'

export function Layout() {
  const cards = useBingoStore((s) => s.cards.length)
  const round = useBingoStore((s) => s.round)
  const steps = [
    { to: '/', label: 'Cartillas', badge: cards || undefined },
    { to: '/letter', label: 'Letra' },
    { to: '/play', label: 'Jugar', dot: !!round, disabled: !round && 'Elige la letra primero' },
  ]
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-8">
      <header className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur">
        <NavLink to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid size-8 place-items-center rounded-full bg-brand text-base text-white">B</span>
          <span className="hidden sm:inline">Bingo Gemelo</span>
        </NavLink>
        <nav className="ml-auto flex rounded-xl bg-surface-2 p-1 text-sm font-semibold">
          {steps.map((s) =>
            s.disabled ? (
              <span
                key={s.to}
                aria-disabled="true"
                title={s.disabled}
                className="relative flex cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted opacity-40"
              >
                {s.label}
              </span>
            ) : (
              <NavLink
                key={s.to}
                to={s.to}
                end
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${isActive ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`
                }
              >
                {s.label}
                {s.badge && <span className="rounded-full bg-brand/15 px-1.5 text-xs text-brand">{s.badge}</span>}
                {s.dot && <span className="size-2 animate-pulse rounded-full bg-hit" />}
              </NavLink>
            ),
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
