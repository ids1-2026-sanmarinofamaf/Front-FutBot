import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BehaviorCard } from './BehaviorCard';

describe('BehaviorCard Component', () => {
  const mockOnView = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const behavior = { behavior_id: 7, name: 'Presión Alta', code: 'def play(): ...' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el nombre del comportamiento y los botones de acción', () => {
    render(<BehaviorCard behavior={behavior} onView={mockOnView} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Presión Alta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });

  it('llama a onView con el ID del comportamiento al hacer clic en Ver', async () => {
    const user = userEvent.setup();
    render(<BehaviorCard behavior={behavior} onView={mockOnView} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    await user.click(screen.getByRole('button', { name: 'Ver' }));

    expect(mockOnView).toHaveBeenCalledTimes(1);
    expect(mockOnView).toHaveBeenCalledWith(7);
  });

  it('llama a onEdit con el ID del comportamiento al hacer clic en Editar', async () => {
    const user = userEvent.setup();
    render(<BehaviorCard behavior={behavior} onView={mockOnView} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(7);
  });

  it('solicita confirmación y llama a onDelete con el ID si el usuario confirma', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

    render(<BehaviorCard behavior={behavior} onView={mockOnView} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(confirmSpy).toHaveBeenCalledWith('¿Estás seguro de que deseas eliminar este comportamiento?');
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(7);

    confirmSpy.mockRestore();
  });

  it('no llama a onDelete si el usuario cancela la confirmación', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false);

    render(<BehaviorCard behavior={behavior} onView={mockOnView} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(confirmSpy).toHaveBeenCalledWith('¿Estás seguro de que deseas eliminar este comportamiento?');
    expect(mockOnDelete).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('no falla si no recibe onView, onEdit ni onDelete', async () => {
    const user = userEvent.setup();
    render(<BehaviorCard behavior={behavior} />);

    await user.click(screen.getByRole('button', { name: 'Ver' }));
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(screen.getByText('Presión Alta')).toBeInTheDocument();
  });

  it('muestra la etiqueta Por defecto y deshabilita Editar y Eliminar cuando is_default es true', async () => {
    const user = userEvent.setup();
    const defaultBehavior = { ...behavior, is_default: true };
    render(<BehaviorCard behavior={defaultBehavior} onView={mockOnView} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('Por defecto')).toBeInTheDocument();
    const editBtn = screen.getByRole('button', { name: 'Editar' });
    const deleteBtn = screen.getByRole('button', { name: 'Eliminar' });
    expect(editBtn).toBeDisabled();
    expect(deleteBtn).toBeDisabled();

    await user.click(editBtn);
    await user.click(deleteBtn);
    expect(mockOnEdit).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('deshabilita el botón Eliminar y muestra Eliminando... cuando isDeleting es true', async () => {
    const user = userEvent.setup();
    render(
      <BehaviorCard
        behavior={behavior}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={true}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Eliminando...' });
    expect(deleteBtn).toBeDisabled();

    await user.click(deleteBtn);
    expect(mockOnDelete).not.toHaveBeenCalled();
  });
});

