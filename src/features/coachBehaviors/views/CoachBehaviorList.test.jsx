import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoachBehaviorList } from './CoachBehaviorList';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('../api', () => ({
  getCoachBehaviors: vi.fn(),
  deleteCoachBehavior: vi.fn(),
}));

vi.mock('../components/CoachBehaviorCard', () => ({
  CoachBehaviorCard: ({ coachBehavior, onView, onDelete, isDeleting }) => (
    <div data-testid={`coach-behavior-card-${coachBehavior.coach_behavior_id}`}>
      <span>{coachBehavior.name}</span>
      <button
        onClick={() => onView(coachBehavior.coach_behavior_id)}
        data-testid={`view-btn-${coachBehavior.coach_behavior_id}`}
      >
        Ver
      </button>
      <button
        onClick={() => onDelete(coachBehavior.coach_behavior_id)}
        disabled={isDeleting}
        data-testid={`delete-btn-${coachBehavior.coach_behavior_id}`}
      >
        {isDeleting ? 'Eliminando...' : 'Eliminar'}
      </button>
    </div>
  ),
}));

import { useNavigate } from 'react-router-dom';
import { getCoachBehaviors, deleteCoachBehavior } from '../api';

describe('CoachBehaviorList Component', () => {
  let mockNavigate;

  const mockCoachBehaviors = [
    { coach_behavior_id: 1, name: 'DT Ofensivo' },
    { coach_behavior_id: 2, name: 'DT Conservador' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('muestra el estado de carga inicialmente', () => {
    getCoachBehaviors.mockImplementationOnce(() => new Promise(() => {}));

    render(<CoachBehaviorList />);

    expect(
      screen.getByText(/Cargando comportamientos de DT.../i)
    ).toBeInTheDocument();
  });

  it('muestra el mensaje de lista vacía cuando la API devuelve un array vacío', async () => {
    getCoachBehaviors.mockResolvedValueOnce([]);

    render(<CoachBehaviorList />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /El club no tiene comportamientos de DT creados actualmente/i
        )
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/Cargando comportamientos de DT.../i)
    ).not.toBeInTheDocument();
  });

  it('renderiza la lista de comportamientos de DT correctamente', async () => {
    getCoachBehaviors.mockResolvedValueOnce(mockCoachBehaviors);

    render(<CoachBehaviorList />);

    await waitFor(() => {
      expect(screen.getByTestId('coach-behavior-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('coach-behavior-card-2')).toBeInTheDocument();
    });

    expect(screen.getByText('DT Ofensivo')).toBeInTheDocument();
    expect(screen.getByText('DT Conservador')).toBeInTheDocument();
  });

  it('muestra un mensaje de error si la llamada a la API falla', async () => {
    getCoachBehaviors.mockRejectedValueOnce(
      new Error('Error interno del servidor')
    );

    render(<CoachBehaviorList />);

    await waitFor(() => {
      expect(
        screen.getByText('Error interno del servidor')
      ).toBeInTheDocument();
    });
  });

  it('navega hacia atrás (/club) al hacer clic en el botón de volver', async () => {
    getCoachBehaviors.mockResolvedValueOnce([]);

    render(<CoachBehaviorList />);

    await waitFor(() => {
      expect(screen.getByText(/Volver a Mi Club/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Volver a Mi Club/i));

    expect(mockNavigate).toHaveBeenCalledWith('/club');
  });

  it('navega al detalle del DT al hacer clic en Ver', async () => {
    getCoachBehaviors.mockResolvedValueOnce(mockCoachBehaviors);

    render(<CoachBehaviorList />);

    await waitFor(() => {
      expect(screen.getByTestId('view-btn-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('view-btn-1'));

    expect(mockNavigate).toHaveBeenCalledWith('/club/coach-behaviors/1');
  });

  it('navega a la creación de un DT al hacer clic en Crear Nuevo', async () => {
    getCoachBehaviors.mockResolvedValueOnce([]);

    render(<CoachBehaviorList />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Crear Nuevo/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Crear Nuevo/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/club/coach-behaviors/new');
  });

  it('elimina un DT de la lista cuando deleteCoachBehavior responde con éxito', async () => {
    getCoachBehaviors.mockResolvedValueOnce(mockCoachBehaviors);
    deleteCoachBehavior.mockResolvedValueOnce(null);

    render(<CoachBehaviorList />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-btn-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-btn-1'));

    await waitFor(() => {
      expect(deleteCoachBehavior).toHaveBeenCalledWith(1);
      expect(
        screen.queryByTestId('coach-behavior-card-1')
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('coach-behavior-card-2')).toBeInTheDocument();
  });

  it('muestra el error del backend y mantiene la tarjeta si falla la eliminación', async () => {
    getCoachBehaviors.mockResolvedValueOnce(mockCoachBehaviors);
    deleteCoachBehavior.mockRejectedValueOnce(
      new Error('User cannot perform this action while playing a live match.')
    );

    render(<CoachBehaviorList />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-btn-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-btn-1'));

    await waitFor(() => {
      expect(
        screen.getByText(
          'User cannot perform this action while playing a live match.'
        )
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('coach-behavior-card-1')).toBeInTheDocument();
  });
});

