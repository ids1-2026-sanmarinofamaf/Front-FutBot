import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CreateBehavior } from './CreateBehavior';

// 1. Mocks de dependencias externas
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('../api', () => ({
  createBehavior: vi.fn(),
}));

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }) => (
    <textarea data-testid="code-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

// 2. Importación de módulos mockeados
import { useNavigate } from 'react-router-dom';
import { createBehavior } from '../api';

describe('CreateBehavior View', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('renderiza el título y el formulario con el botón Crear', () => {
    render(<CreateBehavior />);

    expect(screen.getByText('Nuevo comportamiento')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  it('navega al listado de comportamientos al cancelar', async () => {
    const user = userEvent.setup();
    render(<CreateBehavior />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(mockNavigate).toHaveBeenCalledWith('/club/behaviors');
  });

  it('envía los datos al backend y navega al listado en caso de éxito', async () => {
    const user = userEvent.setup();
    createBehavior.mockResolvedValue({ behavior_id: 5 });
    render(<CreateBehavior />);

    await user.type(screen.getByLabelText('Nombre'), 'Ataque');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(createBehavior).toHaveBeenCalledWith({
      name: 'Ataque',
      code: 'def play():\n    return wait()\n',
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/club/behaviors');
    });
  });

  it('muestra el error del backend y no navega si la creación falla', async () => {
    const user = userEvent.setup();
    createBehavior.mockRejectedValue(new Error('Nombre ya utilizado'));
    render(<CreateBehavior />);

    await user.type(screen.getByLabelText('Nombre'), 'Ataque');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => {
      expect(screen.getByText('Nombre ya utilizado')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('muestra un error genérico si la excepción no tiene mensaje', async () => {
    const user = userEvent.setup();
    createBehavior.mockRejectedValue({});
    render(<CreateBehavior />);

    await user.type(screen.getByLabelText('Nombre'), 'Ataque');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => {
      expect(screen.getByText('No se pudo crear el comportamiento.')).toBeInTheDocument();
    });
  });

  it('deshabilita los botones mientras la petición está en curso', async () => {
    const user = userEvent.setup();
    let resolveApi;
    createBehavior.mockReturnValue(new Promise((resolve) => { resolveApi = resolve; }));
    render(<CreateBehavior />);

    await user.type(screen.getByLabelText('Nombre'), 'Ataque');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();

    await act(async () => {
      resolveApi({ behavior_id: 5 });
    });
  });
});

