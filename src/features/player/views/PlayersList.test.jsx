import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { PlayersList } from './PlayersList';
import * as api from '../api';
import { useNavigate, useLocation } from 'react-router-dom';

// 1. Interceptamos la capa de red
vi.mock('../api');

// 2. Interceptamos el enrutador
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

// 3. Aislamos el componente hijo para verificar el paso de props
vi.mock('../components/PlayerCard', () => ({
  PlayerCard: ({ player, onView }) => (
    <div data-testid={`player-card-${player.player_id}`}>
      <span>{player.name}</span>
      <button 
        data-testid={`btn-view-${player.player_id}`}
        onClick={() => onView(player.player_id)}
      >
        Ver detalle
      </button>
    </div>
  ),
}));

describe('PlayersList UI', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ state: null });
  });

  it('muestra el mensaje de error cuando la API falla', async () => {
    // Arrange
    const errorMessage = 'Fallo en la comunicación con el servidor';
    vi.spyOn(api, 'getPlayers').mockRejectedValue(new Error(errorMessage));

    // Act
    render(<PlayersList />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('renderiza el estado vacío si no hay jugadores', async () => {
    // Arrange
    vi.spyOn(api, 'getPlayers').mockResolvedValue([]);

    // Act
    render(<PlayersList />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/El club no tiene jugadores creados actualmente/i)).toBeInTheDocument();
    });
  });

  it('renderiza la lista de jugadores correctamente', async () => {
    // Arrange
    const mockData = [
      { player_id: 1, name: 'Andrés Martínez' },
      { player_id: 2, name: 'Lionel Messi' }
    ];
    vi.spyOn(api, 'getPlayers').mockResolvedValue(mockData);

    // Act
    render(<PlayersList />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Andrés Martínez')).toBeInTheDocument();
      expect(screen.getByText('Lionel Messi')).toBeInTheDocument();
    });
  });

  it('navega a la ruta de creación al hacer clic en "Crear Nuevo"', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.spyOn(api, 'getPlayers').mockResolvedValue([]);
    render(<PlayersList />);

    // Act
    const createButton = await screen.findByRole('button', { name: /Crear Nuevo/i });
    await user.click(createButton);

    // Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club/players/create');
  });

  it('navega al detalle del jugador al ejecutar onView en una tarjeta', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockData = [{ player_id: 15, name: 'Jugador Test' }];
    vi.spyOn(api, 'getPlayers').mockResolvedValue(mockData);
    render(<PlayersList />);

    // Act
    const viewButton = await screen.findByTestId('btn-view-15');
    await user.click(viewButton);

    // Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club/players/15');
  });

  it('renderiza el mensaje de éxito si proviene del estado de navegación', async () => {
    // Arrange
    const successMsg = 'El jugador Lionel Messi fue creado exitosamente.';
    useLocation.mockReturnValue({ state: { successMessage: successMsg } });
    vi.spyOn(api, 'getPlayers').mockResolvedValue([]);

    // Act
    render(<PlayersList />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(successMsg)).toBeInTheDocument();
    });
  });

  it('navega a "/club" al hacer clic en "Volver a Mi Club"', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.spyOn(api, 'getPlayers').mockResolvedValue([]);
    render(<PlayersList />);

    // Act
    const backButton = await screen.findByRole('button', { name: /volver a mi club/i });
    await user.click(backButton);

    // Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club');
  });
});