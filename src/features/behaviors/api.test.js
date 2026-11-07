import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBehaviors,
  getBehaviorById,
  createBehavior,
  updateBehavior,
  createBehaviorPreview,
  stopBehaviorPreview,
} from './api';
import { apiClient } from '../../shared/api/client';

vi.mock('../../shared/api/client', () => ({
  apiClient: vi.fn(),
}));

describe('Behaviors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBehaviors', () => {
    it('debe invocar apiClient con la ruta y el método correctos', async () => {
      apiClient.mockResolvedValue([]);

      await getBehaviors();

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith('/clubes/me/behaviors', {
        method: 'GET',
      });
    });

    it('debe retornar la lista cuando la respuesta es exitosa', async () => {
      const mockData = [
        { behavior_id: 1, name: 'Ofensivo', code: 'kick()' },
      ];
      apiClient.mockResolvedValue(mockData);

      const result = await getBehaviors();

      expect(result).toEqual(mockData);
    });

    it('debe retornar un arreglo vacío si apiClient retorna null', async () => {
      apiClient.mockResolvedValue(null);

      const result = await getBehaviors();

      expect(result).toEqual([]);
    });

    it('debe propagar la excepción si apiClient falla', async () => {
      const networkError = new Error('Unauthorized');
      apiClient.mockRejectedValue(networkError);

      await expect(getBehaviors()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getBehaviorById', () => {
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
      const mockResponse = { behavior_id: 2, name: 'Pasivo', code: 'wait()' };
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

  describe('createBehavior', () => {
    const validPayload = {
      name: 'Nuevo Comportamiento',
      code: 'def play():\n    return wait()',
    };

    it('debe invocar apiClient con POST y solo name y code en el body', async () => {
      const mockResponse = { behavior_id: 5 };
      apiClient.mockResolvedValue(mockResponse);

      const result = await createBehavior(validPayload);

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith('/clubes/me/behaviors', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar un error si faltan datos requeridos', async () => {
      await expect(createBehavior(null)).rejects.toThrow('Datos de comportamiento inválidos o incompletos');
      await expect(createBehavior({ name: 'Solo nombre' })).rejects.toThrow('Datos de comportamiento inválidos o incompletos');
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('debe propagar errores de apiClient', async () => {
      apiClient.mockRejectedValue(new Error('Bad Request'));

      await expect(createBehavior(validPayload)).rejects.toThrow('Bad Request');
    });
  });

  describe('updateBehavior', () => {
    const validPayload = {
      name: 'Comportamiento Editado',
      code: 'def play():\n    return wait()',
    };

    it('debe invocar apiClient con PUT, el ID en la ruta y el body serializado', async () => {
      apiClient.mockResolvedValue(null);

      const result = await updateBehavior(3, validPayload);

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith('/clubes/me/behaviors/3', {
        method: 'PUT',
        body: JSON.stringify(validPayload),
      });
      expect(result).toBeNull();
    });

    it('debe lanzar un error si no se provee el ID', async () => {
      await expect(updateBehavior(undefined, validPayload)).rejects.toThrow('El ID del comportamiento es requerido');
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('debe lanzar un error si faltan datos requeridos', async () => {
      await expect(updateBehavior(3, { name: '', code: 'wait()' })).rejects.toThrow('Datos de comportamiento inválidos o incompletos');
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('debe propagar errores de apiClient', async () => {
      apiClient.mockRejectedValue(new Error('Not Found'));

      await expect(updateBehavior(99, validPayload)).rejects.toThrow('Not Found');
    });
  });

  describe('createBehaviorPreview', () => {
    const validPayload = {
      code: 'def play():\n    return wait()',
      behavior_teammate_1: 1,
      behavior_teammate_2: 2,
    };

    it('debe invocar apiClient con POST y los datos de la previsualización', async () => {
      const mockResponse = { preview_id: '123e4567-e89b-12d3-a456-426614174000' };
      apiClient.mockResolvedValue(mockResponse);

      const result = await createBehaviorPreview(validPayload);

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith('/clubes/me/behaviors/previews', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar un error si faltan datos requeridos', async () => {
      await expect(createBehaviorPreview(null)).rejects.toThrow(
        'Datos de previsualización inválidos o incompletos'
      );
      await expect(
        createBehaviorPreview({ code: 'def play(): pass', behavior_teammate_1: 1 })
      ).rejects.toThrow('Datos de previsualización inválidos o incompletos');
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('debe propagar errores de apiClient', async () => {
      apiClient.mockRejectedValue(new Error('Invalid default behavior'));

      await expect(createBehaviorPreview(validPayload)).rejects.toThrow(
        'Invalid default behavior'
      );
    });
  });

  describe('stopBehaviorPreview', () => {
    it('debe invocar apiClient con DELETE y el previewId en la ruta', async () => {
      apiClient.mockResolvedValue(null);
      const previewId = '123e4567-e89b-12d3-a456-426614174000';

      const result = await stopBehaviorPreview(previewId);

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith(
        `/clubes/me/behaviors/previews/${previewId}`,
        {
          method: 'DELETE',
        }
      );
      expect(result).toBeNull();
    });

    it('debe lanzar un error si no se provee el previewId', async () => {
      await expect(stopBehaviorPreview('')).rejects.toThrow(
        'El ID de la previsualización es requerido'
      );
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('debe propagar errores de apiClient', async () => {
      apiClient.mockRejectedValue(new Error('Preview not found'));

      await expect(stopBehaviorPreview('abc')).rejects.toThrow('Preview not found');
    });
  });
});
