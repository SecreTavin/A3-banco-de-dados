import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AuthProvider } from './shared/auth/AuthContext'
// Fontes servidas pelo proprio app: a apresentacao nao depende de rede externa.
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/figtree'
import './estilos/global.css'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('Elemento #root não existe no index.html.')

createRoot(raiz).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
