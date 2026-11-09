import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCoachBehaviors,
  getCoachBehaviorById,
  createCoachBehavior,
  deleteCoachBehavior,
} from './api';
import { apiClient } from '../../shared/api/client';

vi.mock('../../shared/api/client', () => ({
  apiClient: vi.fn(),
}));

describe('Coach Behaviors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCoachBehaviors', () => {
    it('debe invocar apiClient con la ruta y el método correctos', async () => {
      apiClient.mockResolvedValue([]);

      await getCoachBehaviors();

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith('/clubes/me/coach_behaviors', {
        method: 'GET',
      });
    });

    it('debe retornar la lista cuando la respuesta es exitosa', async () => {
      const mockData = [
        {
          coach_behavior_id: 1,
          name: 'DT Ofensivo',
          code: 'def coach():\n    return []',
        },
      ];
      apiClient.mockResolvedValue(mockData);

      const result = await getCoachBehaviors();

      expect(result).toEqual(mockData);
    });

    it('debe retornar un arreglo vacío si apiClient retorna null', async () => {
      apiClient.mockResolvedValue(null);

      const result = await getCoachBehaviors();

      expect(result).toEqual([]);
    });

    it('debe propagar la excepción si apiClient falla', async () => {
      const networkError = new Error('Unauthorized');
      apiClient.mockRejectedValue(networkError);

      await expect(getCoachBehaviors()).rejects.toThrow('Unauthorized');
    });
  });

  describe('getCoachBehaviorById', () => {
    it('debe invocar apiClient con el parámetro de ruta correcto', async () => {
      apiClient.mockResolvedValue({
        coach_behavior_id: 1,
        name: 'DT Ofensivo',
        code: 'def coach():\n    return []',
      });

      await getCoachBehaviorById(1);

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith('/clubes/me/coach_behaviors/1', {
        method: 'GET',
      });
    });

    it('debe retornar el objeto del comportamiento de DT', async () => {
      const mockResponse = {
        coach_behavior_id: 2,
        name: 'DT Defensivo',
        code: 'def coach():\n    return []',
      };
      apiClient.mockResolvedValue(mockResponse);

      const result = await getCoachBehaviorById(2);

      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar un error si no se provee el ID', async () => {
      await expect(getCoachBehaviorById()).rejects.toThrow(
        'El ID del comportamiento de DT es requerido'
      );
      await expect(getCoachBehaviorById(null)).rejects.toThrow(
        'El ID del comportamiento de DT es requerido'
      );
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('debe propagar errores de red', async () => {
      apiClient.mockRejectedValue(new Error('Coach behavior not found.'));

      await expect(getCoachBehaviorById(99)).rejects.toThrow(
        'Coach behavior not found.'
      );
    });
  });

  describe('createCoachBehavior', () => {
    const validPayload = {
      name: 'Nuevo DT',
      code: 'def coach():\n    return []',
    };

    it('debe invocar apiClient con POST y solo name y code en el body', async () => {
      const mockResponse = {
        coach_behavior_id: 5,
        name: 'Nuevo DT',
        code: 'def coach():\n    return []',
      };
      apiClient.mockResolvedValue(mockResponse);

      const result = await createCoachBehavior(validPayload);

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith('/clubes/me/coach_behaviors', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar un error si faltan datos requeridos', async () => {
      await expect(createCoachBehavior(null)).rejects.toThrow(
        'Datos de comportamiento inválidos o incompletos'
      );
      await expect(createCoachBehavior({ name: 'Solo nombre' })).rejects.toThrow(
        'Datos de comportamiento inválidos o incompletos'
      );
      await expect(createCoachBehavior({ code: 'def coach():\n    return []' })).rejects.toThrow(
        'Datos de comportamiento inválidos o incompletos'
      );
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('debe propagar errores de apiClient', async () => {
      apiClient.mockRejectedValue(new Error('Coach behavior name already exists.'));

      await expect(createCoachBehavior(validPayload)).rejects.toThrow(
        'Coach behavior name already exists.'
      );
    });
  });

  describe('deleteCoachBehavior', () => {
    it('debe invocar apiClient con DELETE y el ID en la ruta', async () => {
      apiClient.mockResolvedValue(null);

      const result = await deleteCoachBehavior(3);

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith('/clubes/me/coach_behaviors/3', {
        method: 'DELETE',
      });
      expect(result).toBeNull();
    });

    it('debe lanzar un error si no se provee el ID', async () => {
      await expect(deleteCoachBehavior()).rejects.toThrow(
        'El ID del comportamiento de DT es requerido'
      );
      await expect(deleteCoachBehavior(null)).rejects.toThrow(
        'El ID del comportamiento de DT es requerido'
      );
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('debe propagar errores de apiClient', async () => {
      apiClient.mockRejectedValue(
        new Error('User cannot perform this action while playing a live match.')
      );

      await expect(deleteCoachBehavior(3)).rejects.toThrow(
        'User cannot perform this action while playing a live match.'
      );
    });
  });
});

