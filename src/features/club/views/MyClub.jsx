import { useNavigate } from 'react-router-dom';

export function MyClub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-slate-100 text-center mb-8">Mi Club</h1>

        <button 
          onClick={() => navigate('/club/players')}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors shadow-md"
        >
          Gestión de Jugadores
        </button>
        
        <button 
          onClick={() => navigate('/club/behaviours')}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors shadow-md"
        >
          Gestión de Comportamientos
        </button>

        <button 
          onClick={() => navigate('/club/roster')}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors shadow-md"
        >
          Preparar mi plantilla
        </button>

        <button 
          onClick={() => navigate('/club/stats')}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors shadow-md"
        >
          Estadísticas
        </button>

        <button 
          onClick={() => navigate('/')}
          className="w-full mt-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 text-sm font-medium rounded-xl transition-colors"
        >
          Volver al Menú Principal
        </button>
      </div>
    </div>
  );
}