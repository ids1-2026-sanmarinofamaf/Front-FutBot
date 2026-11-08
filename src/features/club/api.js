import { apiClient } from '../../shared/api/client';

export const getMyClub = () => apiClient('/clubes/me', { method: 'GET' });
