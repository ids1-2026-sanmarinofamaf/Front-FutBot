import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBehaviours, getBehaviourById } from './api';
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


describe('getBehaviourById API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe invocar apiClient con el parámetro de ruta correcto', async () => {
    apiClient.mockResolvedValue({ code: 'defend()' });
    const behaviourId = 1;

    await getBehaviourById(behaviourId);

    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(apiClient).toHaveBeenCalledWith('/clubes/me/behaviours/1', {
      method: 'GET',
    });
  });

  it('debe retornar el objeto del comportamiento', async () => {
    const mockResponse = { behaviour_id: 2, name: 'Pasivo', code: 'wait()', is_valid: true };
    apiClient.mockResolvedValue(mockResponse);

    const result = await getBehaviourById(2);

    expect(result).toEqual(mockResponse);
  });

  it('debe lanzar un error si no se provee el ID', async () => {
    await expect(getBehaviourById()).rejects.toThrow('El ID del comportamiento es requerido');
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('debe propagar errores de red', async () => {
    apiClient.mockRejectedValue(new Error('Not Found'));

    await expect(getBehaviourById(99)).rejects.toThrow('Not Found');
  });
});