import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MainMenu } from './MainMenu';
import { useNavigate } from 'react-router-dom';

// 1. Interceptamos el enrutador
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
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
});