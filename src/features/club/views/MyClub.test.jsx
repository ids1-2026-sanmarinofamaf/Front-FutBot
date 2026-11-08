import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MyClub } from './MyClub';
import { useNavigate } from 'react-router-dom';
import { getMyClub, updateMyClub } from '../api';
import { getCurrentUser } from '../../friendlyGames/api';

vi.mock('../api', () => ({ getMyClub: vi.fn(), updateMyClub: vi.fn() }));
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
      club_avatar: 'default',
      club_id: 1,
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

  it.each([null, { club_name: 'Nuevo club' }])('guarda el nombre y refresca únicamente el club con respuesta %j', async (response) => {
    const user = userEvent.setup();
    updateMyClub.mockResolvedValue(response);
    render(<MyClub />);
    await screen.findByText('San Marino');
    await user.click(screen.getByTitle('Editar nombre'));
    const input = screen.getByLabelText('Nombre del club');
    await user.clear(input);
    await user.type(input, '  Nuevo club  ');
    getMyClub.mockResolvedValueOnce({ club_name: 'Nuevo club', statistics: {} });
    await user.click(screen.getByText('Guardar'));
    await screen.findByText('Nuevo club');
    expect(updateMyClub).toHaveBeenCalledWith({ new_name: 'Nuevo club' });
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(getMyClub).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Club actualizado correctamente')).toBeInTheDocument();
  });

  it('conserva el modal y el nombre ingresado si falla el guardado', async () => {
    const user = userEvent.setup();
    updateMyClub.mockRejectedValue(new Error('El nombre ya está en uso'));
    render(<MyClub />);
    await screen.findByText('San Marino');
    await user.click(screen.getByTitle('Editar nombre'));
    await user.clear(screen.getByLabelText('Nombre del club'));
    await user.type(screen.getByLabelText('Nombre del club'), 'Otro club');
    await user.click(screen.getByText('Guardar'));
    await screen.findByText('El nombre ya está en uso');
    expect(screen.getByLabelText('Nombre del club')).toHaveValue('Otro club');
    expect(screen.getByText('Guardar')).toBeEnabled();
    expect(getMyClub).toHaveBeenCalledTimes(1);
  });

  it('bloquea la edición durante el refresco y conserva los datos anteriores si falla', async () => {
    const user = userEvent.setup();
    let finishSave;
    let failRefresh;
    updateMyClub.mockReturnValue(new Promise(resolve => { finishSave = resolve; }));
    render(<MyClub />);
    await screen.findByText('San Marino');
    await user.click(screen.getByTitle('Editar nombre'));
    await user.clear(screen.getByLabelText('Nombre del club'));
    await user.type(screen.getByLabelText('Nombre del club'), 'Nuevo club');
    getMyClub.mockReturnValueOnce(new Promise((resolve, reject) => { failRefresh = reject; }));
    await user.click(screen.getByText('Guardar'));
    expect(screen.getByText('Guardando…')).toBeDisabled();
    expect(screen.getByText('Cancelar')).toBeDisabled();
    await act(async () => finishSave(null));
    expect(screen.queryByLabelText('Nombre del club')).not.toBeInTheDocument();
    expect(screen.getByText('San Marino')).toBeInTheDocument();
    expect(screen.getByTitle('Editar nombre')).toBeDisabled();
    expect(screen.getByTitle('Editar avatar')).toBeDisabled();
    await act(async () => failRefresh(new Error('Falló la actualización de datos')));
    expect(screen.getByText('Falló la actualización de datos')).toBeInTheDocument();
    expect(screen.getByText('San Marino')).toBeInTheDocument();
    expect(screen.getByTitle('Editar nombre')).toBeEnabled();
    expect(screen.getByTitle('Editar avatar')).toBeEnabled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it.each(['nombre', 'avatar'])('descarta cambios de %s al cancelar sin enviar peticiones', async (type) => {
    const user = userEvent.setup();
    render(<MyClub />);
    await screen.findByText('San Marino');
    await user.click(screen.getByTitle(`Editar ${type}`));
    if (type === 'nombre') {
      await user.clear(screen.getByLabelText('Nombre del club'));
      await user.type(screen.getByLabelText('Nombre del club'), 'Otro club');
    } else {
      fireEvent.change(screen.getByLabelText('Nueva imagen JPG/JPEG (hasta 1 MB)'), {
        target: { files: [new File(['jpeg'], 'club.jpg', { type: 'image/jpeg' })] },
      });
      await waitFor(() => expect(screen.getByText('Guardar')).toBeEnabled());
    }
    await user.click(screen.getByText('Cancelar'));
    expect(screen.queryByText('Guardar')).not.toBeInTheDocument();
    expect(updateMyClub).not.toHaveBeenCalled();
    expect(getMyClub).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTitle(`Editar ${type}`));
    expect(screen.getByText('Guardar')).toBeDisabled();
    if (type === 'nombre') expect(screen.getByLabelText('Nombre del club')).toHaveValue('San Marino');
  });

  it('conserva el avatar seleccionado ante un PUT fallido y permite reintentar', async () => {
    const user = userEvent.setup();
    updateMyClub.mockRejectedValueOnce(new Error('No se pudo guardar el avatar')).mockResolvedValueOnce(null);
    render(<MyClub />);
    await screen.findByText('San Marino');
    await user.click(screen.getByTitle('Editar avatar'));
    fireEvent.change(screen.getByLabelText('Nueva imagen JPG/JPEG (hasta 1 MB)'), {
      target: { files: [new File(['jpeg'], 'club.jpg', { type: 'image/jpeg' })] },
    });
    await waitFor(() => expect(screen.getByText('Guardar')).toBeEnabled());
    await user.click(screen.getByText('Guardar'));
    await screen.findByText('No se pudo guardar el avatar');
    expect(screen.getByText('Guardar')).toBeEnabled();
    expect(screen.getByText('Cancelar')).toBeEnabled();
    expect(updateMyClub).toHaveBeenLastCalledWith({ new_avatar: 'anBlZw==' });
    expect(getMyClub).toHaveBeenCalledTimes(1);
    getMyClub.mockResolvedValueOnce({ club_name: 'San Marino', club_avatar: 'anBlZw==', club_id: 1, statistics: { total_points: 60 } });
    await user.click(screen.getByText('Guardar'));
    await waitFor(() => expect(screen.queryByText('Guardar')).not.toBeInTheDocument());
    expect(updateMyClub).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,anBlZw==');
    expect(screen.getByTitle('Editar nombre')).toBeEnabled();
    expect(screen.getByTitle('Editar avatar')).toBeEnabled();
    await user.click(screen.getByText('Estadísticas'));
    expect(screen.getByText('Puntos totales: 60')).toBeInTheDocument();
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(getMyClub).toHaveBeenCalledTimes(2);
  });

});