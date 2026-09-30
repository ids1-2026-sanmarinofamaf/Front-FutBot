import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerForm } from '../components/PlayerForm';
import { createPlayer } from '../api';

/**
 * Smart view orchestrating the player creation workflow.
 * Wraps PlayerForm to handle API communication, network loading states, and error boundaries.
 * On 2xx response, triggers navigation to the roster view, injecting a success payload into the router state.
 */

export function CreatePlayer() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleCreate = async (formData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      
      // La API ya contiene la inyección del JWT mediante apiClient
      await createPlayer(formData);
      
      // Si la petición es exitosa (código 2xx), redirigimos al listado.
      navigate('/club/players', { 
        state: { successMessage: `El jugador ${formData.name} fue creado exitosamente.` } 
      });
      
    } catch (err) {
      // Manejo de errores 4xx o 5xx
      setServerError(err.message || 'Ocurrió un error inesperado al intentar crear el jugador. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/club/players');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Reclutar Jugador</h2>
        <p className="text-slate-400 text-sm mt-1">
          Define el perfil técnico del nuevo integrante. La suma total de atributos debe ser estrictamente 300.
        </p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-400 text-sm">
          <p className="font-semibold mb-1">Error al procesar la solicitud:</p>
          <p>{serverError}</p>
        </div>
      )}

      <PlayerForm 
        onSubmit={handleCreate} 
        onCancel={handleCancel} 
        isLoading={isSubmitting} 
      />
    </div>
  );
}