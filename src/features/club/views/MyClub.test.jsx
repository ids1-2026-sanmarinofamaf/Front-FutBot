import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MyClub } from './MyClub';
import { useNavigate } from 'react-router-dom';

// 1. Interceptamos el enrutador
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('MyClub UI', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('renderiza la vista de gestión del club correctamente', () => {
    // 1. Act
    render(<MyClub />);

    // 2. Assert
    expect(screen.getByRole('heading', { name: /Mi Club/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gestión de Jugadores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gestión de Comportamientos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volver al Menú Principal/i })).toBeInTheDocument();

    // Verificamos que los botones de features futuras no se rendericen
    expect(screen.queryByRole('button', { name: /Preparar mi plantilla/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Estadísticas/i })).not.toBeInTheDocument();
  });

  it('navega a "/club/players" al hacer clic en "Gestión de Jugadores"', async () => {
    // 1. Arrange
    const user = userEvent.setup();
    render(<MyClub />);

    // 2. Act
    const playersButton = screen.getByRole('button', { name: /Gestión de Jugadores/i });
    await user.click(playersButton);

    // 3. Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club/players');
  });

  it('navega a "/club/behaviours" al hacer clic en "Gestión de Comportamientos"', async () => {
    // 1. Arrange
    const user = userEvent.setup();
    render(<MyClub />);

    // 2. Act
    const behavioursButton = screen.getByRole('button', { name: /Gestión de Comportamientos/i });
    await user.click(behavioursButton);

    // 3. Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club/behaviours');
  });

  it('navega a "/" al hacer clic en "Volver al Menú Principal"', async () => {
    // 1. Arrange
    const user = userEvent.setup();
    render(<MyClub />);

    // 2. Act
    const backButton = screen.getByRole('button', { name: /Volver al Menú Principal/i });
    await user.click(backButton);

    // 3. Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});