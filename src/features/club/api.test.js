import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../shared/api/client';
import { getMyClub, updateMyClub } from './api';
import { getCurrentUser } from '../friendlyGames/api';

vi.mock('../../shared/api/client', () => ({ apiClient: vi.fn() }));

describe('club API', () => {
  beforeEach(() => vi.resetAllMocks());
  it.each([
    [getCurrentUser, '/users/me'],
    [getMyClub, '/clubes/me'],
  ])('consulta %s mediante el cliente autenticado', async (request, endpoint) => {
    const data = { club_name: 'San Marino' };
    apiClient.mockResolvedValueOnce(data);
    expect(await request()).toBe(data);
    expect(apiClient).toHaveBeenLastCalledWith(endpoint, { method: 'GET' });
  });
  it('envía las modificaciones al club mediante PUT y admite respuesta sin contenido', async () => {
    apiClient.mockResolvedValueOnce(null);
    expect(await updateMyClub({ new_name: 'Nuevo club' })).toBeNull();
    expect(apiClient).toHaveBeenLastCalledWith('/clubes/me', {
      method: 'PUT', body: JSON.stringify({ new_name: 'Nuevo club' }),
    });
  });

  it('envía el avatar Base64 sin modificarlo y devuelve la respuesta del PUT', async () => {
    const changes = { new_avatar: 'anBlZw==' };
    const response = { club_name: 'San Marino' };
    apiClient.mockResolvedValueOnce(response);
    expect(await updateMyClub(changes)).toBe(response);
    expect(apiClient).toHaveBeenCalledExactlyOnceWith('/clubes/me', {
      method: 'PUT', body: JSON.stringify(changes),
    });
  });

  it.each([getMyClub, updateMyClub])('propaga el error del cliente autenticado sin ocultarlo', async (request) => {
    const error = new Error('Error del servidor');
    apiClient.mockRejectedValueOnce(error);
    await expect(request({ new_name: 'Otro club' })).rejects.toBe(error);
  });

});
