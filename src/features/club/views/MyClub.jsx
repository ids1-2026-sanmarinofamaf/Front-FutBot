import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function MyClub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

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

        <div className="flex flex-col gap-6">
          {activeTab === 'info' ? (
            <>
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
            <p className="text-slate-400 text-center">Estadísticas del club</p>
          )}
        </div>
      </div>
    </div>
  );
}