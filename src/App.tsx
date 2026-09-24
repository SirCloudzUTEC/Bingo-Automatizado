import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CardEditPage } from './pages/CardEditPage'
import { CardsPage } from './pages/CardsPage'
import { LetterPage } from './pages/LetterPage'
import { PlayPage } from './pages/PlayPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<CardsPage />} />
          <Route path="card/:id" element={<CardEditPage />} />
          <Route path="letter" element={<LetterPage />} />
          <Route path="play" element={<PlayPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
