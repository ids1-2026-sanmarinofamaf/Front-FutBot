import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EditClubNameModal } from './EditClubNameModal';
import { EditClubAvatarModal } from './EditClubAvatarModal';

const CLUB = { club_name: 'San Marino', club_avatar: 'YWJj', club_id: 1 };
const IMAGE_LABEL = 'Nueva imagen JPG/JPEG (hasta 1 MB)';

function selectImage(file) {
  // fireEvent permite comprobar archivos que accept oculta en el selector real.
  fireEvent.change(screen.getByLabelText(IMAGE_LABEL), { target: { files: [file] } });
}

function validImage() {
  return new File(['jpeg'], 'club.jpg', { type: 'image/jpeg' });
}

describe('EditClubNameModal', () => {
  it('precarga el nombre actual y mantiene Guardar deshabilitado', () => {
    render(<EditClubNameModal name={CLUB.club_name} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Nombre del club')).toHaveValue(CLUB.club_name);
    expect(screen.getByText('Guardar')).toBeDisabled();
  });

  it.each([
    { value: 'abc', description: 'el mínimo de 3 caracteres' },
    { value: 'a'.repeat(30), description: 'el máximo de 30 caracteres' },
    { value: '  Atlético Córdoba  ', description: 'un nombre con espacios externos' },
  ])('guarda correctamente $description', async ({ value }) => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditClubNameModal name={CLUB.club_name} onSave={onSave} onCancel={vi.fn()} />);
    const input = screen.getByLabelText('Nombre del club');

    await user.clear(input);
    await user.type(input, value);
    await user.click(screen.getByText('Guardar'));

    expect(onSave).toHaveBeenCalledExactlyOnceWith({ new_name: value.trim() });
  });

  it.each([
    { value: '  ab  ', error: 'El nombre debe tener entre 3 y 30 caracteres' },
    { value: 'a'.repeat(31), error: 'El nombre debe tener entre 3 y 30 caracteres' },
    { value: 'Club 12', error: 'El nombre solo puede contener letras y espacios' },
  ])('muestra el error local y bloquea Guardar para "$value"', async ({ value, error }) => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditClubNameModal name={CLUB.club_name} onSave={onSave} onCancel={vi.fn()} />);
    const input = screen.getByLabelText('Nombre del club');

    await user.clear(input);
    await user.type(input, value);

    expect(screen.getByText(error).parentElement).toBe(input.parentElement);
    expect(screen.getByText('Guardar')).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('no considera cambios los espacios externos', async () => {
    const user = userEvent.setup();
    render(<EditClubNameModal name={CLUB.club_name} onSave={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByLabelText('Nombre del club');

    await user.clear(input);
    await user.type(input, '  San Marino  ');

    expect(screen.getByText('Guardar')).toBeDisabled();
  });

  it('elimina el error cuando se corrige el nombre', async () => {
    const user = userEvent.setup();
    render(<EditClubNameModal name={CLUB.club_name} onSave={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByLabelText('Nombre del club');
    await user.clear(input);
    await user.type(input, 'ab');

    await user.type(input, 'c');

    expect(screen.queryByText('El nombre debe tener entre 3 y 30 caracteres')).not.toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeEnabled();
  });

  it('bloquea el campo y ambos botones mientras guarda', () => {
    render(<EditClubNameModal name={CLUB.club_name} saving onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Nombre del club')).toBeDisabled();
    expect(screen.getByText('Guardando…')).toBeDisabled();
    expect(screen.getByText('Cancelar')).toBeDisabled();
  });
});

describe('EditClubAvatarModal', () => {
  it('muestra el avatar actual sin habilitar Guardar', () => {
    render(<EditClubAvatarModal club={CLUB} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,YWJj');
    expect(screen.getByText('Guardar')).toBeDisabled();
  });

  it('conserva el avatar recibido del club', () => {
    render(<EditClubAvatarModal club={{ ...CLUB, club_avatar: 'YWJj' }} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,YWJj');
  });

  it('previsualiza un JPG válido y habilita Guardar', async () => {
    render(<EditClubAvatarModal club={CLUB} onSave={vi.fn()} onCancel={vi.fn()} />);

    selectImage(validImage());

    await waitFor(() => expect(screen.getByText('Guardar')).toBeEnabled());
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,anBlZw==');
  });

  it('envía únicamente el contenido Base64 al guardar', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EditClubAvatarModal club={CLUB} onSave={onSave} onCancel={vi.fn()} />);
    selectImage(validImage());
    await waitFor(() => expect(screen.getByText('Guardar')).toBeEnabled());

    await user.click(screen.getByText('Guardar'));

    expect(onSave).toHaveBeenCalledExactlyOnceWith({ new_avatar: 'anBlZw==' });
  });

  it('acepta un JPEG de exactamente 1 MB', async () => {
    const image = new File([new Uint8Array(1024 * 1024)], 'limite.jpeg', { type: 'image/jpeg' });
    render(<EditClubAvatarModal club={CLUB} onSave={vi.fn()} onCancel={vi.fn()} />);

    selectImage(image);

    await waitFor(() => expect(screen.getByText('Guardar')).toBeEnabled());
    expect(screen.queryByText('La imagen supera 1 MB')).not.toBeInTheDocument();
  });

  it.each([
    {
      description: 'un formato distinto de JPG',
      file: new File(['png'], 'club.png', { type: 'image/png' }),
      error: 'Solo se permiten archivos JPG',
    },
    {
      description: 'una imagen mayor a 1 MB',
      file: new File([new Uint8Array(1024 * 1024 + 1)], 'grande.jpg', { type: 'image/jpeg' }),
      error: 'La imagen supera 1 MB',
    },
  ])('descarta la selección anterior al recibir $description', async ({ file, error }) => {
    render(<EditClubAvatarModal club={CLUB} onSave={vi.fn()} onCancel={vi.fn()} />);
    selectImage(validImage());
    await waitFor(() => expect(screen.getByText('Guardar')).toBeEnabled());

    selectImage(file);

    expect(screen.getByText(error).parentElement)
      .toBe(screen.getByLabelText(IMAGE_LABEL).parentElement.parentElement);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,YWJj');
    expect(screen.getByText('Guardar')).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('bloquea el selector y ambos botones mientras guarda', () => {
    render(<EditClubAvatarModal club={CLUB} saving onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(IMAGE_LABEL)).toBeDisabled();
    expect(screen.getByText('Guardando…')).toBeDisabled();
    expect(screen.getByText('Cancelar')).toBeDisabled();
  });
});
