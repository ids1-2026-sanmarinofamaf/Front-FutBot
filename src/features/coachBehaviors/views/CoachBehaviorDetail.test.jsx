import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoachBehaviorDetail } from './CoachBehaviorDetail';

vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock('../api', () => ({
  getCoachBehaviorById: vi.fn(),
}));

vi.mock('@monaco-editor/react', () => ({
  default: ({ value }) => <pre data-testid="code-editor">{value}</pre>,
}));

import { useParams, useNavigate } from 'react-router-dom';
import { getCoachBehaviorById } from '../api';

describe('CoachBehaviorDetail Component', () => {
  let mockNavigate;
  const mockCoachBehaviorId = '10';

  const mockCoachBehaviorData = {
    coach_behavior_id: 10,
    name: 'DT Ofensivo',
    code: 'def coach():\n    return []\n',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: mockCoachBehaviorId });
  });

  it('muestra el estado de carga al inicializar el componente', () => {
    getCoachBehaviorById.mockImplementationOnce(() => new Promise(() => {}));

    render(<CoachBehaviorDetail />);

    expect(
      screen.getByText(/Cargando código del comportamiento de DT.../i)
    ).toBeInTheDocument();
  });

  it('renderiza el nombre y el código del DT tras una respuesta exitosa', async () => {
    getCoachBehaviorById.mockResolvedValueOnce(mockCoachBehaviorData);

    render(<CoachBehaviorDetail />);

    await waitFor(() => {
      expect(screen.getByText('DT Ofensivo')).toBeInTheDocument();
    });

    expect(getCoachBehaviorById).toHaveBeenCalledWith(mockCoachBehaviorId);
    expect(screen.getByText(/def coach\(\):/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Cargando código del comportamiento de DT.../i)
    ).not.toBeInTheDocument();
  });

  it('muestra el mensaje de error si la API falla', async () => {
    getCoachBehaviorById.mockRejectedValueOnce(
      new Error('Coach behavior not found.')
    );

    render(<CoachBehaviorDetail />);

    await waitFor(() => {
      expect(
        screen.getByText('Coach behavior not found.')
      ).toBeInTheDocument();
    });
  });

  it('navega hacia atrás (/club/coach-behaviors) al hacer clic en Volver desde la vista principal', async () => {
    getCoachBehaviorById.mockResolvedValueOnce(mockCoachBehaviorData);

    render(<CoachBehaviorDetail />);

    await waitFor(() => {
      expect(screen.getByText('DT Ofensivo')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Volver/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/club/coach-behaviors');
  });

  it('navega hacia atrás (/club/coach-behaviors) al hacer clic en Volver desde la vista de error', async () => {
    getCoachBehaviorById.mockRejectedValueOnce(new Error('Fallo de conexión'));

    render(<CoachBehaviorDetail />);

    await waitFor(() => {
      expect(screen.getByText('Fallo de conexión')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Volver/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/club/coach-behaviors');
  });

  it('abre y cierra el manual de comportamientos de DT desde la vista de detalle', async () => {
    getCoachBehaviorById.mockResolvedValueOnce(mockCoachBehaviorData);

    render(<CoachBehaviorDetail />);

    await waitFor(() => {
      expect(screen.getByText('DT Ofensivo')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Reglas de ejecución/i)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Manual de comportamientos de DT/i })
    );
    expect(screen.getByText(/Reglas de ejecución/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cerrar/i }));
    expect(screen.queryByText(/Reglas de ejecución/i)).not.toBeInTheDocument();
  });
});

