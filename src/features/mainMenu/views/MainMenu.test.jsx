import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MainMenu } from './MainMenu';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRankingREST } from '../api';
import { getMyClub, getClub } from '../../club/api';

vi.mock('../../club/api', () => ({ getMyClub: vi.fn(), getClub: vi.fn() }));

vi.mock('../api', () => ({ getRankingREST: vi.fn() }));

// 1. Interceptamos el enrutador
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

// 2. Aislamos el componente hijo (PlayOption)
vi.mock('../components/PlayOption', () => ({
  PlayOption: ({ onClose }) => (
    <div data-testid="play-option-modal">
      <span>Modal de Juego Abierto</span>
      <button onClick={onClose}>Cerrar Modal</button>
    </div>
  ),
}));

describe('MainMenu UI', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getMyClub.mockReturnValue(new Promise(() => {}));
    useLocation.mockReturnValue({ pathname: '/', state: null });
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('renderiza la vista principal correctamente', () => {
    render(<MainMenu />);

    expect(screen.getByText('FUTBOT')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mi Club/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /JUGAR/i })).toBeInTheDocument();
    
    // El modal de jugar no debe estar visible inicialmente
    expect(screen.queryByTestId('play-option-modal')).not.toBeInTheDocument();
  });

  it('muestra el avatar personalizado y consulta nuevamente al volver al menú', async () => {
    getMyClub.mockResolvedValue({ club_avatar: 'YWJj' });
    const { unmount } = render(<MainMenu />);
    await waitFor(() => expect(screen.getByAltText('Avatar del Club')).toHaveAttribute('src', 'data:image/png;base64,YWJj'));
    unmount();

    getMyClub.mockResolvedValue({ club_avatar: 'ZGVm' });
    render(<MainMenu />);
    await waitFor(() => expect(screen.getByAltText('Avatar del Club')).toHaveAttribute('src', 'data:image/png;base64,ZGVm'));
  });

  it('mantiene disponible el menú si falla la consulta del club', async () => {
    getMyClub.mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    render(<MainMenu />);
    await user.click(screen.getByRole('button', { name: /Mi Club/i }));
    expect(screen.getByAltText('Avatar del Club')).not.toHaveAttribute('src');
    expect(mockNavigate).toHaveBeenCalledWith('/club');
  });

  it('navega a "/club" al hacer clic en el botón "Mi Club"', async () => {
    const user = userEvent.setup();
    render(<MainMenu />);

    const clubButton = screen.getByRole('button', { name: /Mi Club/i });
    await user.click(clubButton);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club');
  });

  it('abre el componente PlayOption al hacer clic en "JUGAR"', async () => {
    const user = userEvent.setup();
    render(<MainMenu />);

    const playButton = screen.getByRole('button', { name: /JUGAR/i });
    await user.click(playButton);

    expect(screen.getByTestId('play-option-modal')).toBeInTheDocument();
  });

  it('cierra el componente PlayOption al disparar la función onClose', async () => {
    const user = userEvent.setup();
    render(<MainMenu />);

    // Abrir el modal
    const playButton = screen.getByRole('button', { name: /JUGAR/i });
    await user.click(playButton);
    expect(screen.getByTestId('play-option-modal')).toBeInTheDocument();

    // Cerrar el modal (interactuando con el mock de PlayOption)
    const closeButton = screen.getByRole('button', { name: /Cerrar Modal/i });
    await user.click(closeButton);

    // Verificamos que el modal se haya desmontado
    expect(screen.queryByTestId('play-option-modal')).not.toBeInTheDocument();
  });
  it('muestra el error de carga del club al volver al menú y limpia el estado', () => {
    useLocation.mockReturnValue({ pathname: '/', state: { clubLoadError: 'Error al cargar el club' } });
    render(<MainMenu />);
    expect(screen.getByText('Error al cargar el club')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true, state: null });
  });

  it('mantiene visible la notificación después de limpiar el estado de navegación', () => {
    useLocation.mockReturnValue({ pathname: '/', state: { clubLoadError: 'No se encontró el club' } });
    const { rerender } = render(<MainMenu />);

    useLocation.mockReturnValue({ pathname: '/', state: null });
    rerender(<MainMenu />);

    expect(screen.getByText('No se encontró el club')).toBeInTheDocument();
    expect(screen.getByText('No se encontró el club').closest('[role="alert"]')).toHaveClass('bg-red-300');
  });

});

it.each(['listado', 'perfil'])('abre desde el menú y sale desde %s sin navegar ni reemplazar el menú', async (view) => {
  const user = userEvent.setup();
  getRankingREST.mockResolvedValue([{ club_id: 42, club_name: 'Talleres', points: 100 }]);
  getClub.mockResolvedValue({ club_name: 'Talleres' });

  render(<MainMenu />);

  const menuTitle = screen.getByText('FUTBOT');

  expect(getRankingREST).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Buscar usuarios' }));
  expect(await screen.findByRole('button', { name: 'Talleres 100 puntos' })).toBeInTheDocument();
  expect(getRankingREST).toHaveBeenCalledTimes(1);

  if (view === 'perfil') {
    await user.click(screen.getByRole('button', { name: 'Talleres 100 puntos' }));
    await screen.findByText('No hay estadísticas disponibles para este club.');

    await user.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByRole('button', { name: 'Talleres 100 puntos' })).toBeInTheDocument();
    expect(getRankingREST).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Talleres 100 puntos' }));
    await screen.findByText('No hay estadísticas disponibles para este club.');
  }

  await user.click(screen.getByRole('button', { name: 'Salir' }));

  expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument();
  expect(screen.getByText('FUTBOT')).toBe(menuTitle);
  expect(useNavigate.mock.results.at(-1).value).not.toHaveBeenCalled();
});
