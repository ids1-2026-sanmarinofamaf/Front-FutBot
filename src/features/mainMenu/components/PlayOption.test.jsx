import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { PlayOption } from './PlayOption';
import { useNavigate } from 'react-router-dom';

// Interceptamos el enrutador
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('PlayOption UI', () => {
  const mockNavigate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('renderiza el modal de opciones de juego correctamente', () => {
    // 1. Act
    render(<PlayOption onClose={mockOnClose} />);

    // 2. Assert
    expect(screen.getByRole('heading', { name: /Jugar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cerrar opciones/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Partidos Amistosos/i })).toBeInTheDocument();
    
    // Verificamos que el botón de Ligas no esté en el DOM (ya que está comentado)
    expect(screen.queryByRole('button', { name: /Ligas/i })).not.toBeInTheDocument();
  });

  it('ejecuta onClose al hacer clic en el botón de cerrar', async () => {
    // 1. Arrange
    const user = userEvent.setup();
    render(<PlayOption onClose={mockOnClose} />);

    // 2. Act
    const closeButton = screen.getByRole('button', { name: /Cerrar opciones/i });
    await user.click(closeButton);

    // 3. Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('navega a "/friendly" al hacer clic en "Partidos Amistosos"', async () => {
    // 1. Arrange
    const user = userEvent.setup();
    render(<PlayOption onClose={mockOnClose} />);

    // 2. Act
    const friendlyButton = screen.getByRole('button', { name: /Partidos Amistosos/i });
    await user.click(friendlyButton);

    // 3. Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/friendly');
  });
});