import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/main.css'
import AppRouter from './app/AppRouter.jsx'
import { AuthProvider } from './features/auth/AuthProvider.jsx'
import { SessionSocketProvider } from './features/auth/SessionSocketProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SessionSocketProvider>
        <AppRouter />
      </SessionSocketProvider>
    </AuthProvider>
  </StrictMode>,
)
