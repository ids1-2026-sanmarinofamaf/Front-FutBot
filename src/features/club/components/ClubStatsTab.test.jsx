import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClubStatsTab } from './ClubStatsTab';

const statistics = {
  total_points: 42,
  matches_played: 20,
  matches_won: 12,
  matches_drawn: 6,
  matches_lost: 2,
  goals_for: 35,
  goals_against: 10,
  leagues_played: 3,
  leagues_won: 1,
};

const groups = [
  ['Rendimiento', [
    ['Puntos totales', 'total_points'],
    ['Partidos jugados', 'matches_played'],
    ['Partidos ganados', 'matches_won'],
    ['Partidos empatados', 'matches_drawn'],
    ['Partidos perdidos', 'matches_lost'],
  ]],
  ['Goles', [['Goles a favor', 'goals_for'], ['Goles en contra', 'goals_against']]],
  ['Ligas', [['Ligas jugadas', 'leagues_played'], ['Ligas ganadas', 'leagues_won']]],
];

describe('ClubStatsTab', () => {
  it('muestra las nueve estadísticas en sus secciones correspondientes, sin controles de edición', () => {
    render(<ClubStatsTab statistics={statistics} />);
    for (const [title, fields] of groups) {
      const section = screen.getByText(title).closest('section');
      for (const [label, field] of fields) {
        const card = within(section).getByText(label).parentElement;
        expect(within(card).getByText(String(statistics[field]))).toBeInTheDocument();
      }
    }
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('muestra los ceros de un club sin actividad', () => {
    const emptyStats = Object.fromEntries(Object.keys(statistics).map(key => [key, 0]));
    render(<ClubStatsTab statistics={emptyStats} />);
    expect(screen.getAllByText('0')).toHaveLength(9);
  });

  it('refleja las estadísticas actualizadas recibidas por props', () => {
    const { rerender } = render(<ClubStatsTab statistics={statistics} />);
    rerender(<ClubStatsTab statistics={{ ...statistics, total_points: 99 }} />);
    expect(within(screen.getByText('Puntos totales').parentElement).getByText('99')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });
});
