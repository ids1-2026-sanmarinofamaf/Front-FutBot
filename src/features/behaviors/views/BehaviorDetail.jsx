import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBehaviorById } from '../api';

export function BehaviorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [behavior, setBehavior] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getBehaviorById(id)
      .then((data) => {
        if (isMounted) {
          setBehavior(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error de comunicación con el servidor.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBack = () => {
    navigate('/club/behaviors');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-slate-900 rounded-xl border border-slate-700">
        <span className="text-slate-400 font-mono animate-pulse">Cargando código del comportamiento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-950/30 border border-red-500 rounded-xl p-6 text-center">
          <p className="text-red-400 font-semibold mb-4">{error}</p>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center bg-slate-800 p-4 border-b border-slate-700">
          <h3 className="text-lg font-bold text-slate-200">
            Comportamiento: <span className="text-emerald-400">{behavior?.name}</span>
          </h3>
          <button 
            onClick={handleBack}
            className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
          >
            Volver
          </button>
        </div>

        <div className="p-4 bg-slate-900 overflow-x-auto">
          <pre className="font-mono text-sm text-blue-300">
            <code>{behavior?.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}