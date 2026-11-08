import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MyClub } from './MyClub';
import { useNavigate } from 'react-router-dom';
import { getMyClub } from '../api';
import { getCurrentUser } from '../../friendlyGames/api';

vi.mock('../api', () => ({ getMyClub: vi.fn() }));
vi.mock('../../friendlyGames/api', () => ({getCurrentUser: vi.fn()}))

// 1. Interceptamos el enrutador
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('MyClub UI', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentUser.mockResolvedValue({ user_name: 'Luca', user_email: 'luca@example.com' });
    getMyClub.mockResolvedValue({
      club_name: 'San Marino',
      statistics: {
        total_points: 42,
        matches_played: 20,
        matches_won: 12,
        matches_drawn: 6,
        matches_lost: 2,
        goals_for: 35,
        goals_against: 10,
        leagues_played: 3,
        leagues_won: 1,
      },
    });
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('renderiza la vista de gestión del club correctamente', async () => {
    // 1. Act
    render(<MyClub />);
    await screen.findByText('San Marino');

    // 2. Assert
    expect(screen.getByRole('heading', { name: /Mi Club/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gestión de Jugadores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gestión de Comportamientos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volver al Menú Principal/i })).toBeInTheDocument();

    // Verificamos que los botones de features futuras no se rendericen
    expect(screen.queryByRole('button', { name: /Preparar mi plantilla/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Estadísticas' })).toBeInTheDocument();
  });

  it('alterna las pestañas sin navegar y vuelve a Información al ingresar nuevamente', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<MyClub />);
    await screen.findByText('San Marino');

    expect(screen.getByRole('button', { name: 'Gestión de Jugadores' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Estadísticas' }));
    expect(screen.getByText('Estadísticas del club')).toBeInTheDocument();
    expect(screen.getByText('Puntos totales: 42')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gestión de Jugadores' })).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(getMyClub).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Información' }));
    expect(screen.getByRole('button', { name: 'Gestión de Jugadores' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Estadísticas' }));
    unmount();
    render(<MyClub />);
    await screen.findByText('San Marino');
    expect(screen.getByRole('button', { name: 'Gestión de Jugadores' })).toBeInTheDocument();
  });

  it('navega a "/club/players" al hacer clic en "Gestión de Jugadores"', async () => {
    // 1. Arrange
    const user = userEvent.setup();
    render(<MyClub />);
    await screen.findByText('San Marino');

    // 2. Act
    const playersButton = screen.getByRole('button', { name: /Gestión de Jugadores/i });
    await user.click(playersButton);

    // 3. Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club/players');
  });

  it('navega a "/club/behaviors" al hacer clic en "Gestión de Comportamientos"', async () => {
    // 1. Arrange
    const user = userEvent.setup();
    render(<MyClub />);
    await screen.findByText('San Marino');

    // 2. Act
    const behaviorsButton = screen.getByRole('button', { name: /Gestión de Comportamientos/i });
    await user.click(behaviorsButton);

    // 3. Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club/behaviors');
  });

  it('navega a "/" al hacer clic en "Volver al Menú Principal"', async () => {
    // 1. Arrange
    const user = userEvent.setup();
    render(<MyClub />);
    await screen.findByText('San Marino');

    // 2. Act
    const backButton = screen.getByRole('button', { name: /Volver al Menú Principal/i });
    await user.click(backButton);

    // 3. Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
  it('inicia ambas peticiones en paralelo y espera a las dos', async () => {
    let resolveUser;
    let resolveClub;
    getCurrentUser.mockReturnValue(new Promise(resolve => { resolveUser = resolve; }));
    getMyClub.mockReturnValue(new Promise(resolve => { resolveClub = resolve; }));
    render(<MyClub />);
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(getMyClub).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Cargando información del club…')).toBeInTheDocument();
    await act(async () => resolveUser({ user_name: 'Luca', user_email: 'luca@example.com' }));
    expect(screen.getByText('Cargando información del club…')).toBeInTheDocument();
    await act(async () => resolveClub({ club_name: 'San Marino' }));
    expect(screen.getByText('San Marino')).toBeInTheDocument();
    expect(screen.getByText('Usuario: Luca')).toBeInTheDocument();
    expect(screen.queryByText('Cargando información del club…')).not.toBeInTheDocument();
  });

  it.each(['user', 'club'])('redirige con la notificación si falla la consulta de %s', async (source) => {
    (source === 'user' ? getCurrentUser : getMyClub).mockRejectedValue(new Error('No se pudo cargar el club'));
    render(<MyClub />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', {
      state: { clubLoadError: 'No se pudo cargar el club' },
    }));
  });

});