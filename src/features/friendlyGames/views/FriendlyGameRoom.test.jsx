import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { FriendlyGameRoom } from './FriendlyGameRoom';
import { useNavigate, useParams } from 'react-router-dom';
import { useFriendlyGamesSocket } from '../FriendlyGamesProvider';
import * as api from '../api';

// Intercepciones
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock('../FriendlyGamesProvider', () => ({
  useFriendlyGamesSocket: vi.fn(),
}));

vi.mock('../api', () => ({
  getCurrentUser: vi.fn(),
  startFriendlyGame: vi.fn(),
}));

describe('FriendlyGameRoom', () => {
  const mockNavigate = vi.fn();
  const mockJoinFG = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useParams.mockReturnValue({ id: '15' });
    useNavigate.mockReturnValue(mockNavigate);
    useFriendlyGamesSocket.mockReturnValue({ messages: {}, joinFG: mockJoinFG });
  });

  it('renderiza la vista para el creador esperando un oponente', async () => {
    // Simulamos que el usuario local es el creador
    api.getCurrentUser.mockResolvedValue({ user_name: 'Club Local' });
    
    useFriendlyGamesSocket.mockReturnValue({
      joinFG: mockJoinFG,
      messages: {
        15: [{
          friendly_game_id: 15,
          state: 'POR_COMENZAR',
          users: [{ user_name: 'Club Local', is_creator: true }]
        }]
      }
    });

    render(<FriendlyGameRoom />);

    await waitFor(() => {
      expect(screen.getByText('Club Local')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Esperando contrincante...')).toBeInTheDocument();
    
    const startButton = screen.getByRole('button', { name: /INICIAR PARTIDO/i });
    expect(startButton).toBeDisabled();
  });

  it('habilita el botón de inicio cuando el creador tiene un oponente', async () => {
    api.getCurrentUser.mockResolvedValue({ user_name: 'Club Local' });
    
    useFriendlyGamesSocket.mockReturnValue({
      joinFG: mockJoinFG,
      messages: {
        15: [{
          friendly_game_id: 15,
          state: 'POR_COMENZAR',
          users: [
            { user_name: 'Club Local', is_creator: true },
            { user_name: 'Oponente FC', is_creator: false }
          ]
        }]
      }
    });

    render(<FriendlyGameRoom />);

    await waitFor(() => {
      expect(screen.getByText('Oponente FC')).toBeInTheDocument();
    });
    
    const startButton = screen.getByRole('button', { name: /INICIAR PARTIDO/i });
    expect(startButton).not.toBeDisabled();
  });

  it('oculta el botón de inicio si el usuario en sesión es el oponente', async () => {
    // Simulamos que el usuario local es el invitado
    api.getCurrentUser.mockResolvedValue({ user_name: 'Oponente FC' });
    
    useFriendlyGamesSocket.mockReturnValue({
      joinFG: mockJoinFG,
      messages: {
        15: [{
          friendly_game_id: 15,
          state: 'POR_COMENZAR',
          users: [
            { user_name: 'Club Local', is_creator: true },
            { user_name: 'Oponente FC', is_creator: false }
          ]
        }]
      }
    });

    render(<FriendlyGameRoom />);

    await waitFor(() => {
      expect(screen.getByText('Oponente FC')).toBeInTheDocument();
    });
    
    expect(screen.queryByRole('button', { name: /INICIAR PARTIDO/i })).not.toBeInTheDocument();
  });

  it('renderiza JoinMatchButton cuando el servidor cambia el estado a JUGANDO', async () => {
    api.getCurrentUser.mockResolvedValue({ user_name: 'Club Local' });
    
    useFriendlyGamesSocket.mockReturnValue({
      joinFG: mockJoinFG,
      messages: {
        15: [{
          friendly_game_id: 15,
          state: 'JUGANDO',
          match_id: 99,
          users: [
            { user_name: 'Club Local', is_creator: true },
            { user_name: 'Oponente FC', is_creator: false }
          ]
        }]
      }
    });

    render(<FriendlyGameRoom />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ENTRAR A LA CANCHA/i })).toBeInTheDocument();
    });
  });
});