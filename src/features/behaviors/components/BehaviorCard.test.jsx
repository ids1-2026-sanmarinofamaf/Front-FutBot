import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BehaviorCard } from './BehaviorCard';

describe('BehaviorCard Component', () => {
  const mockOnView = vi.fn();
  const mockOnEdit = vi.fn();
  const behavior = { behavior_id: 7, name: 'Presión Alta', code: 'def play(): ...' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el nombre del comportamiento y los botones de acción', () => {
    render(<BehaviorCard behavior={behavior} onView={mockOnView} onEdit={mockOnEdit} />);

    expect(screen.getByText('Presión Alta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument();
  });

  it('llama a onView con el ID del comportamiento al hacer clic en Ver', async () => {
    const user = userEvent.setup();
    render(<BehaviorCard behavior={behavior} onView={mockOnView} onEdit={mockOnEdit} />);

    await user.click(screen.getByRole('button', { name: 'Ver' }));

    expect(mockOnView).toHaveBeenCalledTimes(1);
    expect(mockOnView).toHaveBeenCalledWith(7);
  });

  it('llama a onEdit con el ID del comportamiento al hacer clic en Editar', async () => {
    const user = userEvent.setup();
    render(<BehaviorCard behavior={behavior} onView={mockOnView} onEdit={mockOnEdit} />);

    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(7);
  });

  it('no falla si no recibe onView ni onEdit', async () => {
    const user = userEvent.setup();
    render(<BehaviorCard behavior={behavior} />);

    await user.click(screen.getByRole('button', { name: 'Ver' }));
    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getByText('Presión Alta')).toBeInTheDocument();
  });

  it('muestra la etiqueta Por defecto y deshabilita Editar cuando is_default es true', async () => {
    const user = userEvent.setup();
    const defaultBehavior = { ...behavior, is_default: true };
    render(<BehaviorCard behavior={defaultBehavior} onView={mockOnView} onEdit={mockOnEdit} />);

    expect(screen.getByText('Por defecto')).toBeInTheDocument();
    const editBtn = screen.getByRole('button', { name: 'Editar' });
    expect(editBtn).toBeDisabled();

    await user.click(editBtn);
    expect(mockOnEdit).not.toHaveBeenCalled();
  });
});

