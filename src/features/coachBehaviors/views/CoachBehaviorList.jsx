import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoachBehaviors, deleteCoachBehavior } from '../api';
import { CoachBehaviorCard } from '../components/CoachBehaviorCard';

/**
 * Vista de listado de comportamientos de Director Técnico (DT) del club.
 * Permite consultar los DTs existentes, navegar al detalle o creación, y eliminar DTs.
 */
export function CoachBehaviorList() {
  const [coachBehaviors, setCoachBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCoachBehaviors = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCoachBehaviors();
        setCoachBehaviors(data);
      } catch (err) {
        setError(
          err.message ||
            'Fallo en la comunicación con el servidor al obtener los comportamientos de DT.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCoachBehaviors();
  }, []);

  const handleCreateNew = () => {
    navigate('/club/coach-behaviors/new');
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      setError(null);
      await deleteCoachBehavior(id);
      setCoachBehaviors((prev) =>
        prev.filter((item) => item.coach_behavior_id !== id)
      );
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el comportamiento de DT.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="text-slate-400 font-mono animate-pulse">
          Cargando comportamientos de DT...
        </span>
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
        <h2 className="text-2xl font-bold text-slate-100">
          Mis Directores Técnicos
        </h2>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow-sm transition-colors"
        >
          Crear Nuevo
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded text-red-400">
          <p>{error}</p>
        </div>
      )}

      {coachBehaviors.length === 0 ? (
        !error && (
          <div className="p-8 border border-slate-700 border-dashed rounded-lg text-center bg-slate-800/50">
            <p className="text-slate-400">
              El club no tiene comportamientos de DT creados actualmente.
            </p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-4">
          {coachBehaviors.map((coachBehavior) => (
            <CoachBehaviorCard
              key={coachBehavior.coach_behavior_id}
              coachBehavior={coachBehavior}
              onView={(id) => navigate(`/club/coach-behaviors/${id}`)}
              onDelete={handleDelete}
              isDeleting={deletingId === coachBehavior.coach_behavior_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

