import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BehaviorForm } from './BehaviorForm';
import { getBehaviors, createBehaviorPreview } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

vi.mock('../api', () => ({
  validateBehaviorCode: vi.fn(),
  getBehaviors: vi.fn(),
  createBehaviorPreview: vi.fn(),
}));

// Monaco no carga en jsdom: lo reemplazamos por un textarea
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, options }) => (
    <textarea
      data-testid="code-editor"
      value={value}
      readOnly={options.readOnly}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('BehaviorForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ pathname: '/club/behaviors/new', state: null });
  });

  it('renderiza con código por defecto y el submit deshabilitado por falta de nombre', () => {
    render(<BehaviorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} submitLabel="Crear" />);

    expect(screen.getByLabelText('Nombre')).toHaveValue('');
    expect(screen.getByTestId('code-editor')).toHaveValue('def play():\n    return wait()\n');
    expect(screen.getByRole('button', { name: 'Crear' })).toBeDisabled();
  });

  it('muestra los valores iniciales cuando se reciben por props', () => {
    render(
      <BehaviorForm
        initialName="Defensa"
        initialCode={'def play():\n    return wait()'}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText('Nombre')).toHaveValue('Defensa');
    expect(screen.getByTestId('code-editor')).toHaveValue('def play():\n    return wait()');
  });

  it('habilita el submit cuando se ingresa un nombre', async () => {
    const user = userEvent.setup();
    render(<BehaviorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} submitLabel="Crear" />);

    await user.type(screen.getByLabelText('Nombre'), 'Ataque');

    expect(screen.getByRole('button', { name: 'Crear' })).toBeEnabled();
  });

  it('deshabilita el submit si el nombre tiene solo espacios', async () => {
    const user = userEvent.setup();
    render(<BehaviorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} submitLabel="Crear" />);

    await user.type(screen.getByLabelText('Nombre'), '   ');

    expect(screen.getByRole('button', { name: 'Crear' })).toBeDisabled();
  });

  it('deshabilita el submit si el código queda vacío', async () => {
    const user = userEvent.setup();
    render(<BehaviorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} submitLabel="Crear" />);

    await user.type(screen.getByLabelText('Nombre'), 'Ataque');
    fireEvent.change(screen.getByTestId('code-editor'), { target: { value: '' } });

    expect(screen.getByRole('button', { name: 'Crear' })).toBeDisabled();
  });

  it('emite { name, code } con el nombre sin espacios al enviar', async () => {
    const user = userEvent.setup();
    render(<BehaviorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} submitLabel="Crear" />);

    await user.type(screen.getByLabelText('Nombre'), '  Ataque  ');
    fireEvent.change(screen.getByTestId('code-editor'), { target: { value: 'def play():\n    return kick()' } });
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Ataque',
      code: 'def play():\n    return kick()',
    });
  });

  it('llama a onCancel al hacer clic en Cancelar', async () => {
    const user = userEvent.setup();
    render(<BehaviorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('bloquea inputs, editor y botones mientras isSubmitting es true', () => {
    render(
      <BehaviorForm
        initialName="Ataque"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );

    expect(screen.getByLabelText('Nombre')).toBeDisabled();
    expect(screen.getByTestId('code-editor')).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
  });

  it('abre y cierra el manual de comportamientos al hacer clic en su botón', async () => {
    const user = userEvent.setup();
    render(<BehaviorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.queryByText(/Reglas de ejecución/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Manual de comportamientos/i }));
    expect(screen.getByText(/Reglas de ejecución/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cerrar/i }));
    expect(screen.queryByText(/Reglas de ejecución/i)).not.toBeInTheDocument();
  });

  it('abre el modal de prueba con los comportamientos por defecto sin preseleccionar e inicia la previsualización', async () => {
    const user = userEvent.setup();
    getBehaviors.mockResolvedValue([
      { behavior_id: 1, name: 'Defender', is_default: true },
      { behavior_id: 2, name: 'Attacker', is_default: true },
      { behavior_id: 10, name: 'Personalizado', is_default: false },
    ]);
    createBehaviorPreview.mockResolvedValue({ preview_id: 'uuid-999' });

    render(
      <BehaviorForm
        initialName="Mi Jugada"
        initialCode={'def play():\n    return wait()'}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Probar código' }));

    const select1 = await screen.findByLabelText('Compañero 1');
    const select2 = screen.getByLabelText('Compañero 2');
    const startBtn = screen.getByRole('button', { name: 'Iniciar prueba' });

    // Sin preselección inicial y botón deshabilitado
    expect(select1).toHaveValue('');
    expect(select2).toHaveValue('');
    expect(startBtn).toBeDisabled();
    expect(screen.queryByRole('option', { name: 'Personalizado' })).not.toBeInTheDocument();

    await user.selectOptions(select1, '1');
    expect(startBtn).toBeDisabled();

    await user.selectOptions(select2, '2');
    expect(startBtn).toBeEnabled();

    await user.click(startBtn);

    await waitFor(() => {
      expect(createBehaviorPreview).toHaveBeenCalledWith({
        code: 'def play():\n    return wait()',
        behavior_teammate_1: 1,
        behavior_teammate_2: 2,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/club/behaviors/preview/uuid-999', {
        state: {
          returnPath: '/club/behaviors/new',
          draftName: 'Mi Jugada',
          draftCode: 'def play():\n    return wait()',
        },
      });
    });
  });

  it('muestra el error del backend en el modal si createBehaviorPreview falla', async () => {
    const user = userEvent.setup();
    getBehaviors.mockResolvedValue([
      { behavior_id: 1, name: 'Defender', is_default: true },
    ]);
    createBehaviorPreview.mockRejectedValue(new Error('El código no define play()'));

    render(<BehaviorForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.click(screen.getByRole('button', { name: 'Probar código' }));

    const select1 = await screen.findByLabelText('Compañero 1');
    const select2 = screen.getByLabelText('Compañero 2');

    await user.selectOptions(select1, '1');
    await user.selectOptions(select2, '1');
    await user.click(screen.getByRole('button', { name: 'Iniciar prueba' }));

    await waitFor(() => {
      expect(screen.getByText('El código no define play()')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
