import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCoachBehavior } from '../api';
import { CoachBehaviorForm } from '../components/CoachBehaviorForm';

/**
 * Vista para la creación de un nuevo comportamiento de Director Técnico (DT).
 * Envía los datos al backend y redirige al listado de DTs en caso de éxito.
 */
export function CreateCoachBehavior() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleCreate = async (data) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await createCoachBehavior(data);
      navigate('/club/coach-behaviors');
    } catch (err) {
      setServerError(
        err.message || 'No se pudo crear el comportamiento de DT.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">
        Nuevo comportamiento de DT
      </h2>
      {serverError && <p className="mb-4 text-red-400">{serverError}</p>}
      <CoachBehaviorForm
        onSubmit={handleCreate}
        onCancel={() => navigate('/club/coach-behaviors')}
        isSubmitting={isSubmitting}
        submitLabel="Crear"
      />
    </div>
  );
}

