import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { EditBehavior } from './EditBehavior';

// 1. Mocks de dependencias externas
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock('../api', () => ({
  getBehaviorById: vi.fn(),
  updateBehavior: vi.fn(),
}));

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }) => (
    <textarea data-testid="code-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

// 2. Importación de módulos mockeados
import { useParams, useNavigate } from 'react-router-dom';
import { getBehaviorById, updateBehavior } from '../api';

describe('EditBehavior View', () => {
  const mockNavigate = vi.fn();
  const mockBehavior = { behavior_id: 42, name: 'Presión Alta', code: 'def play():\n    return wait()' };

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: '42' });
  });

  it('muestra el estado de carga mientras obtiene el comportamiento', () => {
    getBehaviorById.mockReturnValue(new Promise(() => {}));

    render(<EditBehavior />);

    expect(screen.getByText(/Cargando comportamiento/i)).toBeInTheDocument();
  });

  it('carga el comportamiento por ID y muestra el formulario con sus datos', async () => {
    getBehaviorById.mockResolvedValue(mockBehavior);

    render(<EditBehavior />);

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toHaveValue('Presión Alta');
    });
    expect(getBehaviorById).toHaveBeenCalledWith('42');
    expect(screen.getByTestId('code-editor')).toHaveValue('def play():\n    return wait()');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });

  it('muestra el error si no se puede cargar el comportamiento', async () => {
    getBehaviorById.mockRejectedValue(new Error('Behavior not found'));

    render(<EditBehavior />);

    await waitFor(() => {
      expect(screen.getByText('Behavior not found')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();
  });

  it('navega al detalle del comportamiento al cancelar', async () => {
    const user = userEvent.setup();
    getBehaviorById.mockResolvedValue(mockBehavior);
    render(<EditBehavior />);

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(mockNavigate).toHaveBeenCalledWith('/club/behaviors/42');
  });

  it('envía los cambios al backend y navega al detalle en caso de éxito', async () => {
    const user = userEvent.setup();
    getBehaviorById.mockResolvedValue(mockBehavior);
    updateBehavior.mockResolvedValue(null);
    render(<EditBehavior />);

    const nameInput = await screen.findByLabelText('Nombre');
    await user.clear(nameInput);
    await user.type(nameInput, 'Presión Media');
    fireEvent.change(screen.getByTestId('code-editor'), { target: { value: 'def play():\n    return kick()' } });
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(updateBehavior).toHaveBeenCalledWith('42', {
      name: 'Presión Media',
      code: 'def play():\n    return kick()',
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/club/behaviors/42');
    });
  });

  it('muestra el error del backend y no navega si la edición falla', async () => {
    const user = userEvent.setup();
    getBehaviorById.mockResolvedValue(mockBehavior);
    updateBehavior.mockRejectedValue(new Error('User cannot perform this action while playing a live match.'));
    render(<EditBehavior />);

    await user.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(screen.getByText('User cannot perform this action while playing a live match.')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    // El formulario sigue visible para no perder lo escrito
    expect(screen.getByLabelText('Nombre')).toHaveValue('Presión Alta');
  });

  it('muestra un error genérico si la excepción no tiene mensaje', async () => {
    const user = userEvent.setup();
    getBehaviorById.mockResolvedValue(mockBehavior);
    updateBehavior.mockRejectedValue({});
    render(<EditBehavior />);

    await user.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(screen.getByText('No se pudo guardar el comportamiento.')).toBeInTheDocument();
    });
  });
});

