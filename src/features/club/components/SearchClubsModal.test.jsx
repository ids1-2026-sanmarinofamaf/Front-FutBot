import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { SearchClubsModal } from './SearchClubsModal';
import { getRankingREST } from '../../mainMenu/api';
import { getClub } from '../api';

vi.mock('../../mainMenu/api', () => ({ getRankingREST: vi.fn() }));
vi.mock('../api', () => ({ getClub: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  getRankingREST.mockResolvedValue([
    { club_id: 42, club_name: 'Talleres', points: 100 },
    { club_id: 7, club_name: 'Belgrano', points: 80 },
  ]);
});

it('filtra localmente, consulta por club_id y conserva la búsqueda al volver', async () => {
  const user = userEvent.setup();
  let resolveClub;
  getClub.mockReturnValue(new Promise((resolve) => { resolveClub = resolve; }));
  render(<SearchClubsModal onClose={vi.fn()} />);
  await screen.findByText('Belgrano');
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  await user.type(screen.getByLabelText('Buscar club por nombre'), 'TALL');
  expect(screen.queryByText('Belgrano')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Talleres 100 puntos' }));
  expect(getClub).toHaveBeenCalledWith(42);
  expect(screen.getByText('Cargando club…')).toBeInTheDocument();
  resolveClub({ club_name: 'Talleres' });
  await screen.findByText('Talleres');
  await user.click(screen.getByRole('button', { name: 'Volver' }));
  expect(screen.getByLabelText('Buscar club por nombre')).toHaveValue('TALL');
  expect(getRankingREST).toHaveBeenCalledTimes(1);
  await user.type(screen.getByLabelText('Buscar club por nombre'), 'xyz');
  expect(screen.getByText('No se encontraron clubes.')).toBeInTheDocument();
});

it('muestra la carga inicial y permite cerrar el modal', async () => {
  getRankingREST.mockReturnValue(new Promise(() => {}));
  const onClose = vi.fn();
  render(<SearchClubsModal onClose={onClose} />);
  expect(screen.getByText('Cargando clubes…')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'X' }));
  expect(onClose).toHaveBeenCalledOnce();
});

it('informa errores del listado dentro del modal', async () => {
  getRankingREST.mockRejectedValue(new Error('Error'));
  render(<SearchClubsModal onClose={vi.fn()} />);
  expect(await screen.findByText('No se pudo cargar el listado de clubes.')).toBeInTheDocument();
});

it('permite volver al listado cuando no se encuentra el club', async () => {
  getClub.mockRejectedValue(Object.assign(new Error('Error'), { status: 404 }));
  render(<SearchClubsModal onClose={vi.fn()} />);
  await userEvent.click(await screen.findByRole('button', { name: 'Talleres 100 puntos' }));
  expect(await screen.findByText('No se encontró el club.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
  expect(screen.getByText('Belgrano')).toBeInTheDocument();
});
