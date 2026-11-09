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
  resolveClub({
    club_name: 'Talleres',
    club_avatar: 'YWJj',
    club_stats: {
      total_points: 101,
      goals_for: 22,
      goals_against: 13,
      matches_played: 18,
      matches_won: 10,
      matches_drawn: 5,
      matches_lost: 3,
      leagues_played: 4,
      leagues_won: 2
    },
  });
  await screen.findByText('Talleres');

  expect(screen.getByAltText('Talleres')).toHaveAttribute('src', 'data:image/png;base64,YWJj');
  expect(screen.queryByLabelText('Buscar club por nombre')).not.toBeInTheDocument();
  expect(screen.queryByText('Belgrano')).not.toBeInTheDocument();

  const expectedStats = [
    ['Puntos totales', 101],
    ['Goles a favor', 22],
    ['Goles en contra', 13],
    ['Partidos jugados', 18],
    ['Partidos ganados', 10],
    ['Partidos empatados', 5],
    ['Partidos perdidos', 3],
    ['Ligas jugadas', 4],
    ['Ligas ganadas', 2]
  ];

  for (const [label, value] of expectedStats) {
    expect(screen.getByText(label).parentElement.lastElementChild).toHaveTextContent(String(value));
  }

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
  await userEvent.click(screen.getByRole('button', { name: 'Salir' }));
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

it('muestra las estadísticas cuando el backend las devuelve en statistics', async () => {
  getClub.mockResolvedValue({
    club_name: 'Talleres',
    statistics: {
      total_points: 38,
      matches_played: 34,
      matches_won: 3,
      matches_drawn: 29,
      matches_lost: 2,
      goals_for: 58,
      goals_against: 71
    },
  });

  render(<SearchClubsModal onClose={vi.fn()} />);

  await userEvent.click(await screen.findByRole('button', { name: 'Talleres 100 puntos' }));
  await screen.findByText('Estadísticas del club');

  expect(screen.getByText('Puntos totales').parentElement.lastElementChild).toHaveTextContent('38');

});

it('muestra un mensaje cuando el perfil no incluye estadísticas', async () => {
  getClub.mockResolvedValue({ club_name: 'Talleres' });

  render(<SearchClubsModal onClose={vi.fn()} />);

  await userEvent.click(await screen.findByRole('button', { name: 'Talleres 100 puntos' }));

  expect(await screen.findByText('No hay estadísticas disponibles para este club.')).toBeInTheDocument();
});

it('muestra RightDownAlert ante un error de servidor y permite volver sin consultar el ranking', async () => {
  getClub.mockRejectedValue(Object.assign(new Error('Error'), { status: 500 }));

  render(<SearchClubsModal onClose={vi.fn()} />);

  await userEvent.click(await screen.findByRole('button', { name: 'Talleres 100 puntos' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el club.');

  await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

  expect(screen.getByText('Belgrano')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(getRankingREST).toHaveBeenCalledTimes(1);
});

it('permite cerrar desde el perfil', async () => {
  const onClose = vi.fn();
  getClub.mockResolvedValue({ club_name: 'Talleres' });

  render(<SearchClubsModal onClose={onClose} />);

  await userEvent.click(await screen.findByRole('button', { name: 'Talleres 100 puntos' }));
  await screen.findByText('No hay estadísticas disponibles para este club.');
  await userEvent.click(screen.getByRole('button', { name: 'Salir' }));

  expect(onClose).toHaveBeenCalledOnce();
});
