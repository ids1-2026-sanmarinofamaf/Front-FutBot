import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyClub } from '../api';
import { getCurrentUser } from '../../friendlyGames/api'; 

export function MyClub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  // Hooks para guardar informacion de club y de usuario
  const [user, setUser] = useState(null);
  const [club, setClub] = useState(null);
  // Hook para manejo de caso de cierre de sesión luego de llamado a API
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    let active = true;

    const loadClub = async () => {

      try {

        // Ejecución en paralelo de llamados a API
        const [userData, clubData] = await Promise.all([
          getCurrentUser(),
          getMyClub(),
        ]);

        if (!active) return;
        setUser(userData);
        setClub(clubData);
        setLoading(false);

      } catch (error) {
        if (!active) return;
        navigate('/', { state: { clubLoadError: error.message } });
      }
    };

    loadClub();
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-6">
      
      <div className="max-w-7xl w-full flex flex-col gap-6">

        <div className="flex items-center justify-between">

          <h1 className="text-3xl font-bold text-slate-100 text-center mb-8">Mi Club</h1>

          <button
            onClick={() => navigate('/')}
            className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 text-sm font-medium rounded-xl transition-colors"
          >
            Volver al Menú Principal
          </button>

        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400">Cargando información del club…</p>
          </div>
        ) : (
          <>
            {/* Selector de pestañas */}
            <div className="flex gap-2 border-b border-slate-700">
              {[
                ['info', 'Información'],
                ['stats', 'Estadísticas'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 py-3 font-semibold border-b-2 transition-colors ${activeTab === id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Contenido de pestañas */}
            <div className="flex flex-col gap-6">
              {activeTab === 'info' ? (
                <>
                  <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-100">
                    <h2 className="text-2xl font-bold">{club.club_name}</h2>
                    <p className="mt-4">Usuario: {user.user_name}</p>
                    <p>Correo electrónico: {user.user_email}</p>
                  </div>
                  <button
                    onClick={() => navigate('/club/players')}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors shadow-md"
                  >
                    Gestión de Jugadores
                  </button>

                  <button
                    onClick={() => navigate('/club/behaviors')}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors shadow-md"
                  >
                    Gestión de Comportamientos
                  </button>

                </>
              ) : (
                <div className="text-slate-100">
                  <h2 className="text-xl font-bold mb-4">Estadísticas del club</h2>
                  {[
                    ['Puntos totales', club.statistics.total_points],
                    ['Partidos jugados', club.statistics.matches_played],
                    ['Partidos ganados', club.statistics.matches_won],
                    ['Partidos empatados', club.statistics.matches_drawn],
                    ['Partidos perdidos', club.statistics.matches_lost],
                    ['Goles a favor', club.statistics.goals_for],
                    ['Goles en contra', club.statistics.goals_against],
                    ['Ligas jugadas', club.statistics.leagues_played],
                    ['Ligas ganadas', club.statistics.leagues_won],
                  ].map(([label, value]) => <p key={label}>{label}: {value}</p>)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}