import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBehaviors, getBehaviorById } from './api';
import { apiClient } from '../../shared/api/client';

vi.mock('../../shared/api/client', () => ({
  apiClient: vi.fn(),
}));

describe('getBehaviors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe invocar apiClient con la ruta y el método correctos', async () => {
    apiClient.mockResolvedValue({ behaviors_list: [] });

    await getBehaviors();

    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(apiClient).toHaveBeenCalledWith('/clubes/me/behaviors', {
      method: 'GET',
    });
  });

  it('debe retornar la respuesta cuando es exitosa', async () => {
    const mockData = {
      behaviors_list: [
        { behavior_id: 1, name: 'Ofensivo', code: 'kick()', is_valid: true }
      ]
    };
    apiClient.mockResolvedValue(mockData);

    const result = await getBehaviors();

    expect(result).toEqual(mockData);
  });

  it('debe retornar un objeto vacío si el payload no contiene behaviors_list', async () => {
    apiClient.mockResolvedValue({});

    const result = await getBehaviors();

    expect(result).toEqual({});
  });

  it('debe propagar la excepción si apiClient falla', async () => {
    const networkError = new Error('Unauthorized');
    apiClient.mockRejectedValue(networkError);

    await expect(getBehaviors()).rejects.toThrow('Unauthorized');
  });
});


describe('getBehaviorById API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe invocar apiClient con el parámetro de ruta correcto', async () => {
    apiClient.mockResolvedValue({ code: 'defend()' });
    const behaviorId = 1;

    await getBehaviorById(behaviorId);

    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(apiClient).toHaveBeenCalledWith('/clubes/me/behaviors/1', {
      method: 'GET',
    });
  });

  it('debe retornar el objeto del comportamiento', async () => {
    const mockResponse = { behavior_id: 2, name: 'Pasivo', code: 'wait()', is_valid: true };
    apiClient.mockResolvedValue(mockResponse);

    const result = await getBehaviorById(2);

    expect(result).toEqual(mockResponse);
  });

  it('debe lanzar un error si no se provee el ID', async () => {
    await expect(getBehaviorById()).rejects.toThrow('El ID del comportamiento es requerido');
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('debe propagar errores de red', async () => {
    apiClient.mockRejectedValue(new Error('Not Found'));

    await expect(getBehaviorById(99)).rejects.toThrow('Not Found');
  });
});
