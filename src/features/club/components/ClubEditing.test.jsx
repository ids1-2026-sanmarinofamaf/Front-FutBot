import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EditClubNameModal } from './EditClubNameModal';
import { EditClubAvatarModal } from './EditClubAvatarModal';

const club = { club_name: 'San Marino', club_avatar: 'default', club_id: 1 };

describe('Edición del club', () => {
  it('valida el nombre y envía el valor sin espacios externos', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<EditClubNameModal name={club.club_name} onSave={onSave} onCancel={onCancel} />);
    const input = screen.getByLabelText('Nombre del club');
    expect(input).toHaveValue('San Marino');
    expect(screen.getByText('Guardar')).toBeDisabled();
    for (const value of ['ab', 'a'.repeat(31), 'Club 12']) {
      await user.clear(input);
      await user.type(input, value);
      expect(screen.getByText('Guardar')).toBeDisabled();
    }
    await user.clear(input);
    await user.type(input, '  Nuevo club  ');
    await user.click(screen.getByText('Guardar'));
    expect(onSave).toHaveBeenCalledWith({ new_name: 'Nuevo club' });
    await user.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('bloquea controles mientras guarda y no cierra por Escape ni por el fondo', async () => {
    const onCancel = vi.fn();
    render(<EditClubNameModal name="San Marino" saving onSave={vi.fn()} onCancel={onCancel} />);
    expect(screen.getByText('Guardando…')).toBeDisabled();
    expect(screen.getByText('Cancelar')).toBeDisabled();
    expect(screen.getByLabelText('Nombre del club')).toBeDisabled();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByText('Editar nombre del club').closest('form').parentElement);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('previsualiza JPG en Base64 y descarta la selección al elegir un archivo inválido', async () => {
    const onSave = vi.fn();
    render(<EditClubAvatarModal club={club} onSave={onSave} onCancel={vi.fn()} />);
    const input = screen.getByLabelText('Nueva imagen JPG/JPEG (hasta 1 MB)');
    expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/defaultAvatars/2.png');
    expect(screen.getByText('Guardar')).toBeDisabled();
    fireEvent.change(input, { target: { files: [new File(['jpeg'], 'club.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(screen.getByText('Guardar')).toBeEnabled());
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,anBlZw==');
    fireEvent.click(screen.getByText('Guardar'));
    expect(onSave).toHaveBeenCalledWith({ new_avatar: 'anBlZw==' });
    fireEvent.change(input, { target: { files: [new File(['png'], 'club.png', { type: 'image/png' })] } });
    expect(screen.getByText('Solo se permiten archivos JPG')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeDisabled();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/defaultAvatars/2.png');
    fireEvent.change(input, { target: { files: [new File([new Uint8Array(1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' })] } });
    expect(screen.getByText('La imagen supera 1 MB')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeDisabled();
  });
  it.each(['abc', 'a'.repeat(30), '  Atlético Córdoba  '])('acepta el límite o nombre válido %s', async (value) => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditClubNameModal name="San Marino" onSave={onSave} onCancel={vi.fn()} />);
    await user.clear(screen.getByLabelText('Nombre del club'));
    await user.type(screen.getByLabelText('Nombre del club'), value);
    await user.click(screen.getByText('Guardar'));
    expect(onSave).toHaveBeenCalledWith({ new_name: value.trim() });
  });

  it.each([
    ['  ab  ', 'El nombre debe tener entre 3 y 30 caracteres'],
    ['a'.repeat(31), 'El nombre debe tener entre 3 y 30 caracteres'],
    ['Club 12', 'El nombre solo puede contener letras y espacios'],
  ])('muestra el error local para %s', async (value, message) => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditClubNameModal name="San Marino" onSave={onSave} onCancel={vi.fn()} />);
    await user.clear(screen.getByLabelText('Nombre del club'));
    await user.type(screen.getByLabelText('Nombre del club'), value);
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByText('No se pudo actualizar el club')).not.toBeInTheDocument();
  });

  it('no habilita Guardar si solo cambian espacios externos', async () => {
    const user = userEvent.setup();
    render(<EditClubNameModal name="San Marino" onSave={vi.fn()} onCancel={vi.fn()} />);
    await user.clear(screen.getByLabelText('Nombre del club'));
    await user.type(screen.getByLabelText('Nombre del club'), '  San Marino  ');
    expect(screen.getByText('Guardar')).toBeDisabled();
  });

  it('muestra el avatar personalizado actual y bloquea los controles al guardar', () => {
    render(<EditClubAvatarModal club={{ ...club, club_avatar: 'YWJj' }} saving onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,YWJj');
    expect(screen.getByLabelText('Nueva imagen JPG/JPEG (hasta 1 MB)')).toBeDisabled();
    expect(screen.getByText('Guardando…')).toBeDisabled();
    expect(screen.getByText('Cancelar')).toBeDisabled();
  });

  it('acepta un JPEG de exactamente 1 MB', async () => {
    render(<EditClubAvatarModal club={club} onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nueva imagen JPG/JPEG (hasta 1 MB)'), {
      target: { files: [new File([new Uint8Array(1024 * 1024)], 'limite.jpeg', { type: 'image/jpeg' })] },
    });
    await waitFor(() => expect(screen.getByText('Guardar')).toBeEnabled());
    expect(screen.queryByText('La imagen supera 1 MB')).not.toBeInTheDocument();
  });

  it('restaura el avatar personalizado al rechazar una imagen posterior', async () => {
    render(<EditClubAvatarModal club={{ ...club, club_avatar: 'YWJj' }} onSave={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByLabelText('Nueva imagen JPG/JPEG (hasta 1 MB)');
    fireEvent.change(input, { target: { files: [new File(['jpeg'], 'club.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(screen.getByText('Guardar')).toBeEnabled());
    fireEvent.change(input, { target: { files: [new File(['png'], 'club.png', { type: 'image/png' })] } });
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,YWJj');
    expect(screen.getByText('Guardar')).toBeDisabled();
  });

});
