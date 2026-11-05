import { apiClient } from '../../shared/api/client';

/**
 * Obtiene la lista de comportamientos de DT del club actual.
 * @returns {Promise<Array>} Lista de comportamientos de DT.
 */
export const getCoachBehaviors = async () => {
  const data = await apiClient('/clubes/me/coach_behaviors', {
    method: 'GET',
  });

  return data || [];
};

/**
 * Obtiene el detalle de un comportamiento de DT por su identificador.
 * @param {number|string} id Identificador del comportamiento de DT.
 * @returns {Promise<Object>} Datos del comportamiento de DT.
 */
export const getCoachBehaviorById = async (id) => {
  if (id === undefined || id === null) {
    throw new Error("El ID del comportamiento de DT es requerido");
  }

  const data = await apiClient(`/clubes/me/coach_behaviors/${id}`, {
    method: 'GET',
  });

  return data;
};

/**
 * Crea un nuevo comportamiento de DT en el club actual.
 * @param {Object} coachBehaviorData Datos del comportamiento ({ name, code }).
 * @returns {Promise<Object>} Comportamiento de DT creado.
 */
export const createCoachBehavior = async (coachBehaviorData) => {
  if (!coachBehaviorData || !coachBehaviorData.name || !coachBehaviorData.code) {
    throw new Error("Datos de comportamiento inválidos o incompletos");
  }

  const data = await apiClient('/clubes/me/coach_behaviors', {
    method: 'POST',
    body: JSON.stringify({ name: coachBehaviorData.name, code: coachBehaviorData.code }),
  });

  return data;
};

/**
 * Elimina un comportamiento de DT del club actual por su identificador.
 * @param {number|string} id Identificador del comportamiento de DT a eliminar.
 * @returns {Promise<Object|null>} Respuesta del servidor.
 */
export const deleteCoachBehavior = async (id) => {
  if (id === undefined || id === null) {
    throw new Error("El ID del comportamiento de DT es requerido");
  }

  const data = await apiClient(`/clubes/me/coach_behaviors/${id}`, {
    method: 'DELETE',
  });

  return data;
};
