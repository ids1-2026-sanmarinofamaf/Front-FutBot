import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../shared/api/client';
import { getRankingREST } from './api';
// Ajustá './ranking' al nombre real del archivo que exporta getRankingREST


// El path es el mismo que usa el archivo fuente (se asume el test junto a él)
vi.mock('../../shared/api/client', () => ({ apiClient: vi.fn() }));

const ranking = [
  { club_id: 1, club_name: 'Club A', points: 50 },
  { club_id: 2, club_name: 'Club B', points: 30 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getRankingREST', () => {
  it('llama a GET /ranking una sola vez', async () => {
    apiClient.mockResolvedValue(ranking);

    await getRankingREST();

    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(apiClient).toHaveBeenCalledWith('/ranking', { method: 'GET' });
  });

  it('no envía body (un GET con body hace fallar fetch)', async () => {
    apiClient.mockResolvedValue(ranking);

    await getRankingREST();

    const [, options] = apiClient.mock.calls[0];
    expect(options).not.toHaveProperty('body');
  });

  it('devuelve tal cual la lista que responde apiClient', async () => {
    apiClient.mockResolvedValue(ranking);

    await expect(getRankingREST()).resolves.toEqual(ranking);
  });

  it('devuelve [] cuando el servidor responde con lista vacía', async () => {
    apiClient.mockResolvedValue([]);

    await expect(getRankingREST()).resolves.toEqual([]);
  });

  it('propaga el error de apiClient (401, red, servidor)', async () => {
    const error = { status: 401, detail: 'Unauthorized' };
    apiClient.mockRejectedValue(error);

    await expect(getRankingREST()).rejects.toEqual(error);
  });
});