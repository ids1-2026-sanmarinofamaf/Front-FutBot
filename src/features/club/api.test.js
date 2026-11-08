import { describe, it, expect, vi } from 'vitest';
import { apiClient } from '../../shared/api/client';
import { getMyClub } from './api';
import { getCurrentUser } from '../friendlyGames/api';

vi.mock('../../shared/api/client', () => ({ apiClient: vi.fn() }));

describe('club API', () => {
  it.each([
    [getCurrentUser, '/users/me'],
    [getMyClub, '/clubes/me'],
  ])('consulta %s mediante el cliente autenticado', async (request, endpoint) => {
    const data = { club_name: 'San Marino' };
    apiClient.mockResolvedValueOnce(data);
    expect(await request()).toBe(data);
    expect(apiClient).toHaveBeenLastCalledWith(endpoint, { method: 'GET' });
  });
});
