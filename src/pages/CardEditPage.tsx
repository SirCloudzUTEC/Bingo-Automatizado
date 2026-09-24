import { useNavigate, useParams } from 'react-router-dom'
import { CardEditor } from '../components/CardEditor'
import { nextTheme } from '../lib/themes'
import { useBingoStore } from '../store/useBingoStore'

export function CardEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cards = useBingoStore((s) => s.cards)
  const saveCard = useBingoStore((s) => s.saveCard)
  const existing = cards.find((c) => c.id === id)
  const isNew = !existing

  return (
    <main className="mx-auto w-full max-w-lg">
      <h1 className="mb-1 font-display text-2xl font-bold">{isNew ? 'Nueva cartilla' : `Editar ${existing.name}`}</h1>
      <p className="mb-4 text-sm text-muted">
        Escribe cada número; salta solo al completar 2 dígitos. Usa Enter/espacio para avanzar y las flechas para moverte.
      </p>
      <div className="rounded-3xl bg-surface p-4 shadow-sm ring-1 ring-line sm:p-6">
        <CardEditor
          key={id}
          initial={existing}
          defaultName={`Cartilla ${cards.length + 1}`}
          defaultTheme={nextTheme(cards.length)}
          onCancel={() => navigate('/')}
          onSave={(draft) => {
            saveCard(draft, existing?.id)
            navigate('/')
          }}
        />
      </div>
    </main>
  )
}
