/**
 * Tests unitarios para el componente CoachBehaviorCard.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CoachBehaviorCard } from './CoachBehaviorCard';

describe('CoachBehaviorCard Component', () => {
  const mockOnView = vi.fn();
  const mockOnDelete = vi.fn();
  const coachBehavior = {
    coach_behavior_id: 7,
    name: 'DT Presión Alta',
    code: 'def coach():\n    return []',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el nombre del DT y los botones de acción', () => {
    render(
      <CoachBehaviorCard
        coachBehavior={coachBehavior}
        onView={mockOnView}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('DT Presión Alta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });

  it('llama a onView con el ID del DT al hacer clic en Ver', async () => {
    const user = userEvent.setup();
    render(
      <CoachBehaviorCard
        coachBehavior={coachBehavior}
        onView={mockOnView}
        onDelete={mockOnDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Ver' }));

    expect(mockOnView).toHaveBeenCalledTimes(1);
    expect(mockOnView).toHaveBeenCalledWith(7);
  });

  it('llama a onDelete con el ID del DT al hacer clic en Eliminar', async () => {
    const user = userEvent.setup();
    render(
      <CoachBehaviorCard
        coachBehavior={coachBehavior}
        onView={mockOnView}
        onDelete={mockOnDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(7);
  });

  it('no falla si no recibe onView ni onDelete', async () => {
    const user = userEvent.setup();
    render(<CoachBehaviorCard coachBehavior={coachBehavior} />);

    await user.click(screen.getByRole('button', { name: 'Ver' }));
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(screen.getByText('DT Presión Alta')).toBeInTheDocument();
  });

  it('deshabilita el botón Eliminar y muestra Eliminando... cuando isDeleting es true', async () => {
    const user = userEvent.setup();
    render(
      <CoachBehaviorCard
        coachBehavior={coachBehavior}
        onView={mockOnView}
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

