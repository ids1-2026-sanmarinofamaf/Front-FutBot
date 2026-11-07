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

export const validateBehaviorCode = async (code) => {
  if (!code || !code.trim()) {
    throw new Error("El código del comportamiento es requerido");
  }
  const data = await apiClient('/clubes/me/behaviors/validate', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return data;
};

export const createBehaviorPreview = async (previewData) => {
  if (
    !previewData ||
    !previewData.code ||
    !previewData.code.trim() ||
    !previewData.behavior_teammate_1 ||
    !previewData.behavior_teammate_2
  ) {
    throw new Error("Datos de previsualización inválidos o incompletos");
  }

  const data = await apiClient('/clubes/me/behaviors/previews', {
    method: 'POST',
    body: JSON.stringify({
      code: previewData.code,
      behavior_teammate_1: Number(previewData.behavior_teammate_1),
      behavior_teammate_2: Number(previewData.behavior_teammate_2),
    }),
  });

  return data;
};

export const stopBehaviorPreview = async (previewId) => {
  if (!previewId) {
    throw new Error("El ID de la previsualización es requerido");
  }

  const data = await apiClient(`/clubes/me/behaviors/previews/${previewId}`, {
    method: 'DELETE',
  });

  return data;
};
