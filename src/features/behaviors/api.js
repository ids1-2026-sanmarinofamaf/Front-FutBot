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