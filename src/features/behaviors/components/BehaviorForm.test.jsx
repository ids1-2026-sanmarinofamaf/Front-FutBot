import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BehaviorForm } from './BehaviorForm';

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

  beforeEach(() => {
    vi.clearAllMocks();
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
});
