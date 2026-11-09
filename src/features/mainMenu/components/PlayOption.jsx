import { useNavigate } from 'react-router-dom';

export function PlayOption({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl shadow-2xl max-w-sm w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-wider">Jugar</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl font-bold"
            aria-label="Cerrar opciones"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate('/friendly')}
            className="w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Partidos Amistosos
          </button>
          <button 
            onClick={() => navigate('/league')}
            className="w-full text-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            Ligas
          </button>
        </div>
      </div>
    </div>
  );
}