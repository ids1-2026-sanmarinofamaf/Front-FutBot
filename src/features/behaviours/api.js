import { apiClient } from '../../shared/api/client';

export const getBehaviourById = async (id) => {
  if (id === undefined || id === null) {
    throw new Error("El ID del comportamiento es requerido");
  }
  
  const data = await apiClient(`/clubes/me/behaviours/${id}`, {
    method: 'GET',
  });
  
  return data; 
};