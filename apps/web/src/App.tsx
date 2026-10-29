import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './shared/ui'
import type { AbaNavegacao } from './shared/ui'
import { useAuth } from './shared/auth/AuthContext'
import { LoginView } from './features/autenticacao/views/LoginView'
import { DesafiosView } from './features/desafios/views/DesafiosView'
import { CriarDesafioView } from './features/desafios/views/CriarDesafioView'
import { DetalheDesafioView } from './features/desafios/views/DetalheDesafioView'
import { GruposView } from './features/grupos/views/GruposView'
import { DetalheGrupoView } from './features/grupos/views/DetalheGrupoView'
import { VotacaoView } from './features/votacao/views/VotacaoView'
import { RankingView } from './features/ranking/views/RankingView'
import { PerfilView } from './features/perfil/views/PerfilView'

const ABAS: AbaNavegacao[] = [
  { rota: '/desafios', rotulo: 'Desafios', icone: 'desafios' },
  { rota: '/votacao', rotulo: 'Votação', icone: 'votacao' },
  { rota: '/grupos', rotulo: 'Grupos', icone: 'grupos' },
  { rota: '/ranking', rotulo: 'Ranking', icone: 'ranking' },
  { rota: '/perfil', rotulo: 'Perfil', icone: 'perfil' },
]

function AreaAutenticada() {
  const { usuario, sair } = useAuth()
  const local = useLocation()

  if (!usuario) return <Navigate to="/login" replace state={{ de: local.pathname }} />

  return <AppShell usuario={usuario} abas={ABAS} aoSair={sair} />
}

function AreaPublica() {
  const { usuario } = useAuth()
  return usuario ? <Navigate to="/desafios" replace /> : <Outlet />
}

export function App() {
  return (
    <Routes>
      <Route element={<AreaPublica />}>
        <Route path="/login" element={<LoginView />} />
      </Route>

      <Route element={<AreaAutenticada />}>
        <Route path="/desafios" element={<DesafiosView />} />
        <Route path="/desafios/nova" element={<CriarDesafioView />} />
        <Route path="/desafios/:id" element={<DetalheDesafioView />} />
        <Route path="/grupos" element={<GruposView />} />
        <Route path="/grupos/:id" element={<DetalheGrupoView />} />
        <Route path="/votacao" element={<VotacaoView />} />
        <Route path="/ranking" element={<RankingView />} />
        <Route path="/perfil" element={<PerfilView />} />
      </Route>

      <Route path="*" element={<Navigate to="/desafios" replace />} />
    </Routes>
  )
}
