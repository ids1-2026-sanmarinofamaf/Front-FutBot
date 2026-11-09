import { apiClient } from '../../shared/api/client';

export const getMyClub = () => apiClient('/clubes/me', { method: 'GET' });

export const getClub = (id) => apiClient(`/clubes/${id}`, { method: 'GET' });

export const updateMyClub = (changes) => apiClient('/clubes/me', {
  method: 'PUT',
  body: JSON.stringify(changes),
});
