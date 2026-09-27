import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/main.css'
import AppRouter from './app/AppRouter.jsx'
import { AuthProvider } from './features/auth/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>,
)
