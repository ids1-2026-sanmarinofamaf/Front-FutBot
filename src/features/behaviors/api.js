import { apiClient } from '../../shared/api/client';

export const getBehaviors = async () => {
  const data = await apiClient('/clubes/me/behaviors', {
    method: 'GET',
  });

  return data || [];
};

export const getBehaviorById = async (id) => {
  if (id === undefined || id === null) {
    throw new Error("El ID del comportamiento es requerido");
  }
  
  const data = await apiClient(`/clubes/me/behaviors/${id}`, {
    method: 'GET',
  });
  
  return data; 
};

export const createBehavior = async (behaviorData) => {
  if (!behaviorData || !behaviorData.name || !behaviorData.code) {
    throw new Error("Datos de comportamiento inválidos o incompletos");
  }

  const data = await apiClient('/clubes/me/behaviors', {
    method: 'POST',
    body: JSON.stringify({ name: behaviorData.name, code: behaviorData.code }),
  });

  return data;
};

export const updateBehavior = async (id, behaviorData) => {
  if (id === undefined || id === null) {
    throw new Error("El ID del comportamiento es requerido");
  }
  if (!behaviorData || !behaviorData.name || !behaviorData.code) {
    throw new Error("Datos de comportamiento inválidos o incompletos");
  }

  const data = await apiClient(`/clubes/me/behaviors/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: behaviorData.name, code: behaviorData.code }),
  });

  return data;
};

