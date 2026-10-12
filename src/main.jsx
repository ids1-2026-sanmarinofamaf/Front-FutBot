import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app/main.css'
import AppRouter from './app/AppRouter.jsx'
import { AuthProvider } from './features/auth/AuthProvider.jsx'
import { SessionSocketProvider } from './features/auth/SessionSocketProvider.jsx'
import { FriendlyGamesSocketProvider } from './features/friendlyGames/FriendlyGamesProvider.jsx'
import { LeaguesSocketProvider } from './features/leagues/LeaguesProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SessionSocketProvider>
        <FriendlyGamesSocketProvider>
          <LeaguesSocketProvider>
            <AppRouter />
          </LeaguesSocketProvider>
        </FriendlyGamesSocketProvider>
      </SessionSocketProvider>
    </AuthProvider>
  </StrictMode>,
)
