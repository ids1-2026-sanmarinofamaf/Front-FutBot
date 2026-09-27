import { apiClient } from '../../shared/api/client';

export const getBehaviours = async () => {
  const data = await apiClient('/clubes/me/behaviours', {
    method: 'GET',
  });
  
  return data.behaviours_list || [];
};