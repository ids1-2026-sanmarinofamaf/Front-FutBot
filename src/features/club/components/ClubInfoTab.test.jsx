import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClubInfoTab } from './ClubInfoTab';

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
const userData = { user_name: 'Luca', user_email: 'luca@example.com' };
const club = { club_name: 'San Marino', club_avatar: 'YWJj', club_id: 1 };

describe('ClubInfoTab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra los datos del club y del usuario en modo de lectura', () => {
    render(<ClubInfoTab user={userData} club={club} />);
    expect(screen.getByText('San Marino')).toBeInTheDocument();
    expect(screen.getByText('Usuario: Luca')).toBeInTheDocument();
    expect(screen.getByText('Correo electrónico: luca@example.com')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'San Marino' })).toHaveAttribute('src', 'data:image/png;base64,YWJj');
    expect(screen.getByRole('img')).toHaveClass('w-28', 'h-28');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('mantiene el avatar predeterminado según el id del club', () => {
    render(<ClubInfoTab user={userData} club={{ ...club, club_avatar: 'default' }} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/defaultAvatars/2.png');
  });

  it('llama al callback correspondiente al editar nombre o avatar', async () => {
    const user = userEvent.setup();
    const onEditName = vi.fn();
    const onEditAvatar = vi.fn();
    render(<ClubInfoTab user={userData} club={club} onEditName={onEditName} onEditAvatar={onEditAvatar} />);
    await user.click(screen.getByTitle('Editar nombre'));
    expect(onEditName).toHaveBeenCalledOnce();
    expect(onEditAvatar).not.toHaveBeenCalled();
    await user.click(screen.getByTitle('Editar avatar'));
    expect(onEditAvatar).toHaveBeenCalledOnce();
  });

  it('bloquea ambos botones de edición durante el refresco', async () => {
    const user = userEvent.setup();
    const onEditName = vi.fn();
    const onEditAvatar = vi.fn();
    render(<ClubInfoTab user={userData} club={club} editingDisabled onEditName={onEditName} onEditAvatar={onEditAvatar} />);
    for (const title of ['Editar nombre', 'Editar avatar']) {
      expect(screen.getByTitle(title)).toBeDisabled();
      await user.click(screen.getByTitle(title));
    }
    expect(onEditName).not.toHaveBeenCalled();
    expect(onEditAvatar).not.toHaveBeenCalled();
  });

  it.each([
    ['Gestión de Jugadores', '/club/players'],
    ['Gestión de Comportamientos', '/club/behaviors'],
  ])('navega desde %s', async (label, route) => {
    const user = userEvent.setup();
    render(<ClubInfoTab user={userData} club={club} />);
    await user.click(screen.getByText(label));
    expect(navigate).toHaveBeenCalledExactlyOnceWith(route);
  });
});
