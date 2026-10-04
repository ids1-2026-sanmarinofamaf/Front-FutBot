import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBehaviors } from '../api';
import { BehaviorCard } from '../components/BehaviorCard';

export function BehaviorList() {
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchBehaviors = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBehaviors();
        setBehaviors(data);
      } catch (err) {
        setError(err.message || 'Fallo en la comunicación con el servidor al obtener los comportamientos.');
      } finally {
        setLoading(false);
      }
    };

    fetchBehaviors();
  }, []);

  console.log(behaviors)

  const handleCreateNew = () => {
    console.info('Endpoint de creación de comportamiento no implementado en el sprint actual.');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="text-slate-400 font-mono animate-pulse">Cargando comportamientos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button 
        onClick={() => navigate('/club')}
        className="mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors shadow-sm"
      >
        ← Volver a Mi Club
      </button>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Mis Comportamientos</h2>
        <button 
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-sm transition-colors cursor-not-allowed opacity-80"
          title="No disponible en este sprint"
        >
          Crear Nuevo
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded text-red-400">
          <p>{error}</p>
        </div>
      )}

      {!error && behaviors.length === 0 ? (
        <div className="p-8 border border-slate-700 border-dashed rounded-lg text-center bg-slate-800/50">
          <p className="text-slate-400">El club no tiene comportamientos creados actualmente.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {behaviors.map((behavior) => (
            <BehaviorCard 
              key={behavior.behavior_id} 
              behavior={behavior} 
              onView={(id) => navigate(`/club/behaviors/${id}`)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}