import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPlayers, createPlayer, getPlayerById } from './api';
import { apiClient } from '../../shared/api/client';

// Intercepción de la dependencia externa
vi.mock('../../shared/api/client', () => ({
  apiClient: vi.fn(),
}));

describe('Players API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlayers', () => {
    it('debe invocar apiClient con GET y la ruta correcta', async () => {
      apiClient.mockResolvedValue({ players_list: [] });

      await getPlayers();

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith('/clubes/me/players', {
        method: 'GET',
      });
    });

    it('debe retornar players_list cuando la respuesta es exitosa', async () => {
      const mockData = 
        [{ player_id: 1, name: 'Andrés Martínez' }];
      apiClient.mockResolvedValue(mockData);

      const result = await getPlayers();

      expect(result).toEqual(mockData);
    });

    it('debe retornar un arreglo vacío si players_list no está definido', async () => {
      apiClient.mockResolvedValue({});

      const result = await getPlayers();

      expect(result).toEqual({});
    });
  });

  describe('createPlayer', () => {
    const validPayload = {
      name: 'Andy Martínez',
      power: 60,
      agility: 60,
      control: 60,
      speed: 60,
      strength: 60
    };

    it('debe invocar apiClient con POST y el payload serializado', async () => {
      const mockResponse = { player_id: 1, ...validPayload };
      apiClient.mockResolvedValue(mockResponse);

      const result = await createPlayer(validPayload);

      expect(apiClient).toHaveBeenCalledTimes(1);
      expect(apiClient).toHaveBeenCalledWith('/clubes/me/players', {
        method: 'POST',
        body: JSON.stringify(validPayload)
      });
      expect(result).toEqual(mockResponse);
    });

    it('debe lanzar una excepción si el payload es nulo', async () => {
      await expect(createPlayer(null)).rejects.toThrow('Datos de jugador inválidos o incompletos');
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('debe lanzar una excepción si falta el nombre en el payload', async () => {
      const invalidPayload = { power: 60, agility: 60 };
      
      await expect(createPlayer(invalidPayload)).rejects.toThrow('Datos de jugador inválidos o incompletos');
      expect(apiClient).not.toHaveBeenCalled();
    });

    it('debe propagar excepciones lanzadas por apiClient (errores de red o servidor)', async () => {
      const serverError = new Error('Error 400 Bad Request');
      apiClient.mockRejectedValue(serverError);

      await expect(createPlayer(validPayload)).rejects.toThrow('Error 400 Bad Request');
    });
    
  });


    describe('getPlayerById', () => {
      it('llama al endpoint correcto con el ID del jugador', async () => {
          // Arrange
          const mockPlayer = { player_id: 15, name: 'Jugador Test' };
          apiClient.mockResolvedValueOnce(mockPlayer);
          const playerId = 15;

          // Act
          const result = await getPlayerById(playerId);

          // Assert
          expect(apiClient).toHaveBeenCalledTimes(1);
          expect(apiClient).toHaveBeenCalledWith(`/clubes/me/players/${playerId}`, {
              method: 'GET',
          });
          expect(result).toEqual(mockPlayer);
      });

      it('lanza un error si no se proporciona un ID', async () => {
          // Act & Assert
          await expect(getPlayerById()).rejects.toThrow('ID de jugador requerido');
          expect(apiClient).not.toHaveBeenCalled();
      });
    });
});