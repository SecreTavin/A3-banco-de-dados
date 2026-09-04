import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AuthProvider } from './shared/auth/AuthContext'
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
