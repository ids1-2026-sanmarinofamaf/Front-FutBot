import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBehavior } from '../useBehavior';
import { CodeEditor } from "../components/CodeEditor";
import { BehaviorApiDocs } from "../components/BehaviorApiDocs";

export function BehaviorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { behavior, isLoading, error } = useBehavior(id);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  
  const isDefault = Boolean(behavior?.is_default);

  const handleEdit = () => {
    navigate(`/club/behaviors/${id}/edit`);
  };
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
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-200">
              Comportamiento: <span className="text-emerald-400">{behavior?.name}</span>
            </h3>
            {isDefault && (
              <span className="text-xs px-2 py-1 rounded font-mono border bg-slate-700/60 text-slate-300 border-slate-600">
                Por defecto
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsDocsOpen(true)}
              className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
            >
              Manual de comportamientos
            </button>
            {!isDefault && (
              <button 
                onClick={handleEdit}
                className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
              >
                Editar
              </button>
            )}
            <button 
              onClick={handleBack}
              className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
            >
              Volver
            </button>
          </div>
        </div>

        <CodeEditor value={behavior?.code} readOnly />
      </div>
      <BehaviorApiDocs isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}