import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet } from "react-router-dom";
import { AuthContext } from "../features/auth/AuthProvider.jsx";

// Importación de Vistas Base
import { MainMenu } from "../features/mainMenu";
import { MyClub } from "../features/club";
import LoginView from "../features/auth";
import FriendlyGames from "../features/friendlyGames/index.js";
import { MatchPage } from "../features/match";

// Importación de Entidades
import { PlayersList, CreatePlayer } from "../features/player";
import { BehaviorList, BehaviorDetail } from "../features/behaviors/index.js";

// Placeholder reutilizable
const PlaceholderView = ({ title }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl shadow-xl max-w-md w-full text-center flex flex-col items-center">
        <div className="text-yellow-500 text-4xl mb-4">🚧</div>
        <h2 className="mi-fuente text-4xl tracking-wide text-slate-100 mb-2">
          {title}
        </h2>
        <p className="text-slate-400 mb-8 font-mono text-sm">
          Módulo en desarrollo para el próximo sprint.
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-semibold rounded-lg transition-colors shadow-sm"
        >
          Volver atrás
        </button>
      </div>
    </div>
  );
};

// Validador de Rutas Privadas
const PrivateRoutes = () => {
  const { isAuthenticated } = useContext(AuthContext);
  // Si está autenticado, renderiza las rutas hijas (Outlet). Si no, redirige.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppRouter = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginView />} 
        />
        
        {/* Agrupación de Rutas Protegidas */}
        <Route element={<PrivateRoutes />}>
          {/* Rutas Estructurales */}
          <Route path="/" element={<MainMenu />} />
          <Route path="/club" element={<MyClub />} />
          
          {/* Módulo: Jugadores */}
          <Route path="/club/players" element={<PlayersList />} />
          {/** <Route path="/club/players/:id" element={<PlaceholderView title="TESTING" />} /> */}
          <Route path="/club/players/create" element={<CreatePlayer />} />
          
          {/* Módulo: Comportamientos */}
          <Route path="/club/behaviors" element={<BehaviorList />} />
          <Route path="/club/behaviors/:id" element={<BehaviorDetail />} />

          {/* Módulo: Partidos */}
          <Route path="/matches/:matchId" element={<MatchPage />} />

          {/* Placeholders con el diseño del proyecto */}
          <Route path="/club/roster" element={<PlaceholderView title="Plantilla" />} />
          <Route path="/club/stats" element={<PlaceholderView title="Estadísticas" />} />
          <Route path="/friendly" element={<FriendlyGames />} />
          <Route path="/friendly/lobby/:id" element={<PlaceholderView title="FriendlyGameView" />} />
          <Route path="/league" element={<PlaceholderView title="Ligas" />} />
        </Route>

        {/* Fallback general */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;