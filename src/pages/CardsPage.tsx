import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { CardGrid } from '../components/CardGrid'
import { Button, ConfirmButton } from '../components/ui'
import { THEMES } from '../lib/themes'
import { useBingoStore } from '../store/useBingoStore'

export function CardsPage() {
  const { cards, removeCard, round } = useBingoStore()
  const navigate = useNavigate()

  return (
    <main className="flex flex-col gap-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Tus cartillas</h1>
          <p className="text-muted">Crea el gemelo digital de cada cartilla física. Puedes corregirlas cuando quieras.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => navigate('/card/new')}>
            + Agregar cartilla
          </Button>
          {cards.length > 0 && (
            <Button onClick={() => navigate(round ? '/play' : '/letter')}>{round ? 'Volver al juego →' : 'Elegir letra →'}</Button>
          )}
        </div>
      </section>

      {cards.length === 0 ? (
        <button
          onClick={() => navigate('/card/new')}
          className="grid place-items-center gap-2 rounded-3xl border-2 border-dashed border-line py-20 text-muted transition hover:border-brand hover:text-brand"
        >
          <span className="text-5xl">＋</span>
          <span className="font-semibold">Agrega tu primera cartilla</span>
        </button>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {cards.map((card) => (
              <motion.article
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col gap-3 rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-line"
              >
                <div className="flex items-center gap-2">
                  <span className={`size-3 rounded-full ${THEMES[card.theme].swatch}`} />
                  <h2 className="flex-1 truncate font-display text-lg font-semibold">{card.name}</h2>
                </div>
                <Link to={`/card/${card.id}`} aria-label={`Editar ${card.name}`}>
                  <CardGrid card={card} compact />
                </Link>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => navigate(`/card/${card.id}`)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/card/new?from=${card.id}`)}>
                    Duplicar
                  </Button>
                  <div className="flex-1" />
                  <ConfirmButton onConfirm={() => removeCard(card.id)}>Eliminar</ConfirmButton>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </main>
  )
}
