import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPlayers } from '../api';
import { PlayerCard } from '../components/PlayerCard';

export function PlayersList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.successMessage;

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPlayers();
        setPlayers(data);
      } catch (err) {
        setError(err.message || 'Fallo en la comunicación con el servidor al obtener los jugadores.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleCreateNew = () => {
    navigate('/club/players/create');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="text-slate-400 font-mono animate-pulse">Cargando jugadores...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Mis Jugadores</h2>
        <button 
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-sm transition-colors"
        >
          Crear Nuevo
        </button>
      </div>

        {successMessage && (
        <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-500 rounded text-emerald-400 font-medium">
            {successMessage}
        </div>
        )} 

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded text-red-400">
          <p>{error}</p>
        </div>
      )}

      {!error && players.length === 0 ? (
        <div className="p-8 border border-slate-700 border-dashed rounded-lg text-center bg-slate-800/50">
          <p className="text-slate-400">El club no tiene jugadores creados actualmente.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {players.map((player) => (
            <PlayerCard 
              key={player.player_id} 
              player={player} 
              onView={(id) => navigate(`/club/players/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}