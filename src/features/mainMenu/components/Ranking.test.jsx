import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';

import Ranking from './Ranking';
import { getRankingREST } from '../api';
import { getCurrentUser } from '../../friendlyGames/api';

// ÍNDICE

// ✓ src/features/mainMenu/components/Ranking.test.jsx (11 tests) 261ms
// ✓ Ranking global (11)
//     ✓ al hacer clic en RANKING se abre el popup y se pide GET /ranking 83ms
//     ✓ mientras espera la respuesta muestra el estado de carga 4ms
//     ✓ con datos, lista todos los clubes en el orden recibido con posición, nombre y puntos 40ms
//     ✓ con muchos clubes, la lista hace scroll dentro del popup 34ms
//     ✓ resalta la fila del club del usuario cuando está en la lista 8ms
//     ✓ si el club del usuario no está en la lista, no resalta nada 9ms
//     ✓ con 200 y [] muestra "Aún no hay clubes en el ranking" 2ms
//     ✓ ante error de red/servidor muestra un mensaje de error 5ms
//     ✓ si falla /users/me, igual se muestra el ranking y se avisa el error 7ms
//     ✓ el popup se cierra únicamente con el botón X 29ms
//     ✓ al cerrar y reabrir, vuelve a pedir el ranking 39ms

// Los paths de vi.mock son relativos a este archivo (se asume que está junto a Ranking.jsx)
vi.mock('../api', () => ({ getRankingREST: vi.fn() }));
vi.mock('../../friendlyGames/api', () => ({ getCurrentUser: vi.fn() }));
vi.mock('../../../shared/hooks', () => ({
  useToast: () => ({
    toast: { id: 1 },
    showToast: vi.fn(),
    hideToast: vi.fn(),
  }),
}));
vi.mock('../../../shared/components/RightDownAlert', () => ({
  default: ({ errorDescription }) => <div role="alert">{errorDescription}</div>,
}));

// Datos desordenados a propósito: el front NO debe reordenar
const ranking = [
  { club_id: 1, club_name: 'Club A', points: 10 },
  { club_id: 2, club_name: 'Club B', points: 50 },
  { club_id: 3, club_name: 'Club C', points: 30 },
];

// Imita cómo MainMenu abre/cierra el popup
function Host() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>RANKING</button>
      {open && <Ranking onClose={() => setOpen(false)} />}
    </>
  );
}

const dataRows = () => screen.getAllByRole('row').slice(1); // sin el encabezado

beforeEach(() => {
  vi.clearAllMocks();
  getRankingREST.mockResolvedValue(ranking);
  getCurrentUser.mockResolvedValue({ user_id: 999 });
});

describe('Ranking global', () => {
  it('al hacer clic en RANKING se abre el popup y se pide GET /ranking', async () => {
    const user = userEvent.setup();
    render(<Host />);

    expect(screen.queryByText('Ranking global')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'RANKING' }));

    expect(screen.getByText('Ranking global')).toBeInTheDocument();
    await waitFor(() => expect(getRankingREST).toHaveBeenCalledTimes(1));
  });

  it('mientras espera la respuesta muestra el estado de carga', () => {
    getRankingREST.mockReturnValue(new Promise(() => {})); // nunca resuelve
    render(<Ranking onClose={() => {}} />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('con datos, lista todos los clubes en el orden recibido con posición, nombre y puntos', async () => {
    render(<Ranking onClose={() => {}} />);

    await screen.findByRole('table');
    expect(
      screen.getAllByRole('columnheader').map((h) => h.textContent)
    ).toEqual(['Posición', 'Nombre', 'Puntos']);

    const rows = dataRows();
    expect(rows).toHaveLength(ranking.length);

    ranking.forEach((club, i) => {
      const cells = within(rows[i]).getAllByRole('cell');
      expect(cells[0]).toHaveTextContent(String(i + 1)); // posición consecutiva
      expect(cells[1]).toHaveTextContent(club.club_name);
      expect(cells[2]).toHaveTextContent(String(club.points));
    });
  });

  it('con muchos clubes, la lista hace scroll dentro del popup', async () => {
    getRankingREST.mockResolvedValue(
      Array.from({ length: 50 }, (_, i) => ({
        club_id: i + 1,
        club_name: `Club ${i + 1}`,
        points: 100 - i,
      }))
    );
    render(<Ranking onClose={() => {}} />);

    const table = await screen.findByRole('table');
    expect(dataRows()).toHaveLength(50);
    expect(table.parentElement).toHaveClass('max-h-96', 'overflow-y-auto');
  });

  it('resalta la fila del club del usuario cuando está en la lista', async () => {
    getCurrentUser.mockResolvedValue({ user_id: 2 });
    render(<Ranking onClose={() => {}} />);

    await screen.findByText('Club B');
    await waitFor(() =>
      expect(screen.getByText('Club B').closest('tr')).toHaveClass('bg-emerald-900/40')
    );
    expect(screen.getByText('Club A').closest('tr')).not.toHaveClass('bg-emerald-900/40');
    expect(screen.getByText('Club C').closest('tr')).not.toHaveClass('bg-emerald-900/40');
  });

  it('si el club del usuario no está en la lista, no resalta nada', async () => {
    getCurrentUser.mockResolvedValue({ user_id: 999 });
    render(<Ranking onClose={() => {}} />);

    await screen.findByRole('table');
    await waitFor(() => expect(getCurrentUser).toHaveBeenCalled());
    dataRows().forEach((row) => expect(row).not.toHaveClass('bg-emerald-900/40'));
  });

  it('con 200 y [] muestra "Aún no hay clubes en el ranking"', async () => {
    getRankingREST.mockResolvedValue([]);
    render(<Ranking onClose={() => {}} />);

    expect(await screen.findByText('Aún no hay clubes en el ranking')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('ante error de red/servidor muestra un mensaje de error', async () => {
    getRankingREST.mockRejectedValue(new Error('network'));
    render(<Ranking onClose={() => {}} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Error desconocido al cargar ranking.'
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('si falla /users/me, igual se muestra el ranking y se avisa el error', async () => {
    getCurrentUser.mockRejectedValue(new Error('boom'));
    render(<Ranking onClose={() => {}} />);

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Error desconocido al obtener datos de usuario.'
    );
  });

  it('el popup se cierra únicamente con el botón X', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<Ranking onClose={onClose} />);
    await screen.findByRole('table');

    await user.click(container.firstChild); // clic en el fondo
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cerrar ranking' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('al cerrar y reabrir, vuelve a pedir el ranking', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.click(screen.getByRole('button', { name: 'RANKING' }));
    await screen.findByRole('table');
    expect(getRankingREST).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cerrar ranking' }));
    expect(screen.queryByText('Ranking global')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'RANKING' }));
    await screen.findByRole('table');
    expect(getRankingREST).toHaveBeenCalledTimes(2);
  });
});