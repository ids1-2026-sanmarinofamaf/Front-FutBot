import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ClubEditModal } from './ClubEditModal';

describe('ClubEditModal', () => {
  it('muestra el contenido y envía el formulario una sola vez', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ClubEditModal title="Editar club" canSave onSave={onSave} onCancel={vi.fn()}><p>Formulario del club</p></ClubEditModal>);
    expect(screen.getByText('Formulario del club')).toBeInTheDocument();
    await user.click(screen.getByText('Guardar'));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it.each([[false, false], [true, true], [false, true]])('impide enviar con canSave=%s y saving=%s', (canSave, saving) => {
    const onSave = vi.fn();
    render(<ClubEditModal title="Editar club" canSave={canSave} saving={saving} onSave={onSave} onCancel={vi.fn()} />);
    const button = screen.getByText(saving ? 'Guardando…' : 'Guardar');
    expect(button).toBeDisabled();
    fireEvent.submit(button.closest('form'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('solo cierra por Cancelar, sin guardar', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<ClubEditModal title="Editar club" canSave onSave={onSave} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByText('Editar club').closest('form').parentElement);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByText('×')).not.toBeInTheDocument();
    await user.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });
});
