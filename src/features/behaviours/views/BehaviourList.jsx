import { useState, useEffect } from 'react';
import { getBehaviours } from '../api';
import { BehaviourCard } from '../components/BehaviourCard';
import { BehaviourDetail } from './BehaviourDetail'; // <-- Importamos la nueva vista

export function BehaviourList() {
  const [behaviours, setBehaviours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para controlar la navegación interna
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchBehaviours = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBehaviours();
        setBehaviours(data);
      } catch (err) {
        setError(err.message || 'Fallo en la comunicación con el servidor al obtener los comportamientos.');
      } finally {
        setLoading(false);
      }
    };

    fetchBehaviours();
  }, []);

  const handleCreateNew = () => {
    console.info('Endpoint de creación de comportamiento no implementado en el sprint actual.');
  };

  // --- RENDERIZADO CONDICIONAL DE NAVEGACIÓN ---
  // Si hay un ID seleccionado, ocultamos la lista y mostramos el detalle
  if (selectedId !== null) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <BehaviourDetail 
          id={selectedId} 
          onBack={() => setSelectedId(null)} // Al volver, limpiamos el estado
        />
      </div>
    );
  }

  // --- RENDERIZADO ORIGINAL DE LA LISTA ---
  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="text-slate-400 font-mono animate-pulse">Cargando comportamientos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
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

      {!error && behaviours.length === 0 ? (
        <div className="p-8 border border-slate-700 border-dashed rounded-lg text-center bg-slate-800/50">
          <p className="text-slate-400">El club no tiene comportamientos creados actualmente.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {behaviours.map((behaviour) => (
            <BehaviourCard 
              key={behaviour.behaviour_id} // Corregido el typo aquí
              behaviour={behaviour} 
              onView={setSelectedId} // Pasamos la función de seteo de estado
            />
          ))}
        </div>
      )}
    </div>
  );
}