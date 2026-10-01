import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { PlayerForm } from './PlayerForm';

describe('PlayerForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza con valores por defecto (sumatoria 300) y submit deshabilitado por falta de nombre', () => {
    render(<PlayerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Total: 300 / 300')).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /Crear Jugador/i });
    expect(submitBtn).toBeDisabled();
  });

  it('habilita el submit cuando se ingresa un nombre y la sumatoria es exactamente 300', async () => {
    const user = userEvent.setup();
    render(<PlayerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const nameInput = screen.getByLabelText(/Nombre del Jugador/i);
    await user.type(nameInput, 'Andrés Martínez');

    const submitBtn = screen.getByRole('button', { name: /Crear Jugador/i });
    expect(submitBtn).toBeEnabled();
  });

  it('deshabilita el submit y muestra advertencia si la sumatoria supera 300', async () => {
    const user = userEvent.setup();
    render(<PlayerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Escribimos el nombre para que ese no sea el motivo del bloqueo
    await user.type(screen.getByLabelText(/Nombre del Jugador/i), 'Test');

    // Buscamos todos los botones '+' y hacemos clic en el primero (Power)
    const plusButtons = screen.getAllByRole('button', { name: '+' });
    await user.click(plusButtons[0]); // Power pasa a 61, total 301

    expect(screen.getByText('Capacidad excedida: Resta 1 puntos.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Jugador/i })).toBeDisabled();
  });

  it('deshabilita el submit y muestra advertencia si la sumatoria es menor a 300', async () => {
    const user = userEvent.setup();
    render(<PlayerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.type(screen.getByLabelText(/Nombre del Jugador/i), 'Test');

    const minusButtons = screen.getAllByRole('button', { name: '-' });
    await user.click(minusButtons[0]); // Power pasa a 59, total 299

    expect(screen.getByText('Puntos disponibles: 1.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear Jugador/i })).toBeDisabled();
  });

  it('emite el objeto correcto al ejecutar onSubmit', async () => {
    const user = userEvent.setup();
    render(<PlayerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.type(screen.getByLabelText(/Nombre del Jugador/i), 'Jugador Estrella');
    
    // Consultamos el DOM dinámicamente en el momento exacto del clic
    await user.click(screen.getAllByRole('button', { name: '+' })[0]); // Power +
    await user.click(screen.getAllByRole('button', { name: '-' })[1]); // Agility -

    const submitBtn = screen.getByRole('button', { name: /Crear Jugador/i });
    await user.click(submitBtn);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Jugador Estrella',
      power: 61,
      agility: 59,
      control: 60,
      speed: 60,
      strength: 60
    });
  });

  it('ejecuta onCancel al presionar el botón Cancelar', async () => {
    const user = userEvent.setup();
    render(<PlayerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});