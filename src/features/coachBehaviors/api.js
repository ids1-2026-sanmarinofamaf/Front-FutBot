import { apiClient } from '../../shared/api/client';

export const getCoachBehaviors = async () => {
  const data = await apiClient('/clubes/me/coach_behaviors', {
    method: 'GET',
  });

  return data || [];
};

export const getCoachBehaviorById = async (id) => {
  if (id === undefined || id === null) {
    throw new Error("El ID del comportamiento de DT es requerido");
  }

  const data = await apiClient(`/clubes/me/coach_behaviors/${id}`, {
    method: 'GET',
  });

  return data;
};

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

export const deleteCoachBehavior = async (id) => {
  if (id === undefined || id === null) {
    throw new Error("El ID del comportamiento de DT es requerido");
  }

  const data = await apiClient(`/clubes/me/coach_behaviors/${id}`, {
    method: 'DELETE',
  });

  return data;
};
