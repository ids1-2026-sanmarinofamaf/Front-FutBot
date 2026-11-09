import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Scoreboard } from './Scoreboard';

describe('Scoreboard', () => {

  it('muestra correctamente los nombres de los equipos', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          user1_goals: 2,
          user2_goals: 1,
          actual_tic: "450",
          total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('team 1')).toBeInTheDocument();
    expect(screen.getByText('team 2')).toBeInTheDocument();
  });

  it('muestra correctamente los goles de ambos equipos', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          user1_goals: 5,
          user2_goals: 3,
          actual_tic: "450",
          total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('muestra el tiempo actual del partido sobre el tiempo total en segundos', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          user1_goals: 2,
          user2_goals: 1,
          actual_tic: "450",
          total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('45/90sec')).toBeInTheDocument();
    expect(screen.getByText('Time:')).toBeInTheDocument();
  });

  it('muestra correctamente valores cero en el marcador', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          user1_goals: 0,
          user2_goals: 0,
          actual_tic: "0",
          total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText('0/90sec')).toBeInTheDocument();
  });

  it('actualiza el marcador cuando cambian los props', () => {
    const { rerender } = render(
      <svg>
        <Scoreboard estado_partido={{
          user1_goals: 1,
          user2_goals: 0,
          actual_tic: "100",
          total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10/90sec')).toBeInTheDocument();

    rerender(
      <svg>
        <Scoreboard estado_partido={{
          user1_goals: 4,
          user2_goals: 2,
          actual_tic: "500",
          total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('50/90sec')).toBeInTheDocument();
    expect(screen.queryByText('10/90sec')).not.toBeInTheDocument();
  });

  it('mantiene separados los nombres de los equipos y sus respectivos goles', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          user1_goals: 7,
          user2_goals: 4,
          actual_tic: "800",
          total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('team 1')).toBeInTheDocument();
    expect(screen.getByText('team 2')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    expect(screen.queryByText('team 17')).not.toBeInTheDocument();
    expect(screen.queryByText('team 24')).not.toBeInTheDocument();
  });

  it('dibuja el fondo del marcador y los cuadros negros', () => {
    const { container } = render(
      <svg>
        <Scoreboard estado_partido={{
          user1_goals: 0,
          user2_goals: 0,
          actual_tic: "0",
          total_tic: "900"
        }} />
      </svg>
    );

    const rects = container.querySelectorAll('rect');

    expect(rects).toHaveLength(3);

    const scoreboardRects = Array.from(rects).filter(function (rect) {
      return rect.getAttribute('fill') === '#1e293b';
    });

    const blackRects = Array.from(rects).filter(function (rect) {
      return rect.getAttribute('fill') === 'Black';
    });

    expect(scoreboardRects).toHaveLength(1);
    expect(blackRects).toHaveLength(2);
  });

  it('muestra los nombres reales de los clubes cuando matchInfo está presente', () => {
    const matchInfo = {
      team_a: { club_name: 'Boca Juniors' },
      team_b: { club_name: 'River Plate' },
    };

    render(
      <svg>
        <Scoreboard
          estado_partido={{
            user1_goals: 2,
            user2_goals: 1,
            actual_tic: "450",
            total_tic: "900"
          }}
          matchInfo={matchInfo}
        />
      </svg>
    );

    expect(screen.getByText('Boca Juniors')).toBeInTheDocument();
    expect(screen.getByText('River Plate')).toBeInTheDocument();
    expect(screen.queryByText('team 1')).not.toBeInTheDocument();
    expect(screen.queryByText('team 2')).not.toBeInTheDocument();
  });

  it('muestra el período actual cuando current_period está presente en estado_partido', () => {
    render(
      <svg>
        <Scoreboard
          estado_partido={{
            user1_goals: 0,
            user2_goals: 0,
            actual_tic: "150",
            total_tic: "600",
            current_period: 2
          }}
        />
      </svg>
    );

    expect(screen.getByText('Q2')).toBeInTheDocument();
  });

});