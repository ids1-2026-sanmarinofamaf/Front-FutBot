import { apiClient } from '../../shared/api/client';

export const getBehaviours = async () => {
  const data = await apiClient('/clubes/me/behaviours', {
    method: 'GET',
  });

  return data.behaviours_list || [];
};

export const getBehaviourById = async (id) => {
  if (id === undefined || id === null) {
    throw new Error("El ID del comportamiento es requerido");
  }
  
  const data = await apiClient(`/clubes/me/behaviours/${id}`, {
    method: 'GET',
  });
  
  return data; 
};