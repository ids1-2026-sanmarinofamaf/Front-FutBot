import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CreateCoachBehavior } from './CreateCoachBehavior';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('../api', () => ({
  createCoachBehavior: vi.fn(),
}));

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }) => (
    <textarea
      data-testid="code-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

import { useNavigate } from 'react-router-dom';
import { createCoachBehavior } from '../api';

describe('CreateCoachBehavior View', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('renderiza el título y el formulario con el botón Crear', () => {
    render(<CreateCoachBehavior />);

    expect(
      screen.getByText('Nuevo comportamiento de DT')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  it('navega al listado de DTs al cancelar', async () => {
    const user = userEvent.setup();
    render(<CreateCoachBehavior />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(mockNavigate).toHaveBeenCalledWith('/club/coach-behaviors');
  });

  it('envía los datos al backend y navega al listado en caso de éxito', async () => {
    const user = userEvent.setup();
    createCoachBehavior.mockResolvedValue({ coach_behavior_id: 5 });
    render(<CreateCoachBehavior />);

    await user.type(screen.getByLabelText('Nombre'), 'DT Ofensivo');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(createCoachBehavior).toHaveBeenCalledWith({
      name: 'DT Ofensivo',
      code: 'def coach():\n    return []\n',
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/club/coach-behaviors');
    });
  });

  it('muestra el error del backend y no navega si la creación falla', async () => {
    const user = userEvent.setup();
    createCoachBehavior.mockRejectedValue(
      new Error('Coach behavior name already exists.')
    );
    render(<CreateCoachBehavior />);

    await user.type(screen.getByLabelText('Nombre'), 'DT Ofensivo');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => {
      expect(
        screen.getByText('Coach behavior name already exists.')
      ).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('deshabilita los botones mientras la petición está en curso', async () => {
    const user = userEvent.setup();
    let resolveApi;
    createCoachBehavior.mockReturnValue(
      new Promise((resolve) => {
        resolveApi = resolve;
      })
    );
    render(<CreateCoachBehavior />);

    await user.type(screen.getByLabelText('Nombre'), 'DT Ofensivo');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();

    await act(async () => {
      resolveApi({ coach_behavior_id: 5 });
    });
  });
});

