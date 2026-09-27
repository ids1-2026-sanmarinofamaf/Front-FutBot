import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBehaviours } from './api';
import { apiClient } from '../../shared/api/client';

vi.mock('../../shared/api/client', () => ({
  apiClient: vi.fn(),
}));

describe('getBehaviours API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe invocar apiClient con la ruta y el método correctos', async () => {
    apiClient.mockResolvedValue({ behaviours_list: [] });

    await getBehaviours();

    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(apiClient).toHaveBeenCalledWith('/clubes/me/behaviours', {
      method: 'GET',
    });
  });

  it('debe retornar el arreglo behaviours_list cuando la respuesta es exitosa', async () => {
    const mockData = {
      behaviours_list: [
        { behaviour_id: 1, name: 'Ofensivo', code: 'kick()', is_valid: true }
      ]
    };
    apiClient.mockResolvedValue(mockData);

    const result = await getBehaviours();

    expect(result).toEqual(mockData.behaviours_list);
  });

  it('debe retornar un arreglo vacío si behaviours_list no existe en el payload', async () => {
    apiClient.mockResolvedValue({});

    const result = await getBehaviours();

    expect(result).toEqual([]);
  });

  it('debe propagar la excepción si apiClient falla', async () => {
    const networkError = new Error('Unauthorized');
    apiClient.mockRejectedValue(networkError);

    await expect(getBehaviours()).rejects.toThrow('Unauthorized');
  });
});