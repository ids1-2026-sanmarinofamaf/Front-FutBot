import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCoachBehaviorById } from '../api';
import { CodeEditor } from '../../behaviors/components/CodeEditor';
import { CoachApiDocs } from '../components/CoachApiDocs';

/**
 * Vista de detalle en modo solo lectura de un comportamiento de Director Técnico (DT).
 * Carga el comportamiento por su ID y muestra su nombre y código Python.
 */
export function CoachBehaviorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coachBehavior, setCoachBehavior] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getCoachBehaviorById(id)
      .then((data) => {
        if (isMounted) setCoachBehavior(data);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error de comunicación con el servidor.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBack = () => {
    navigate('/club/coach-behaviors');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 bg-slate-900 rounded-xl border border-slate-700">
        <span className="text-slate-400 font-mono animate-pulse">
          Cargando código del comportamiento de DT...
        </span>
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
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-200">
              Director Técnico:{' '}
              <span className="text-emerald-400">{coachBehavior?.name}</span>
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsDocsOpen(true)}
              className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
            >
              Manual de comportamientos de DT
            </button>
            <button
              onClick={handleBack}
              className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
            >
              Volver
            </button>
          </div>
        </div>

        <CodeEditor value={coachBehavior?.code} readOnly />
      </div>
      <CoachApiDocs isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}

