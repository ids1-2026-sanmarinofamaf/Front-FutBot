import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Scoreboard } from './Scoreboard';

describe('Scoreboard', () => {

  it('muestra correctamente los nombres de los equipos', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          team1: "Team A", team2: "Team B",
          user1_goals: 2, user2_goals: 1,
          actual_tic: "450", total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
  });

  it('usa nombres por defecto si no vienen team1/team2', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          user1_goals: 2, user2_goals: 1,
          actual_tic: "450", total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('Team 1')).toBeInTheDocument();
    expect(screen.getByText('Team 2')).toBeInTheDocument();
  });

  it('muestra correctamente los goles de ambos equipos', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          team1: "Team A", team2: "Team B",
          user1_goals: 5, user2_goals: 3,
          actual_tic: "450", total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('muestra el progreso actual del partido sobre el total de ticks', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          team1: "Team A", team2: "Team B",
          user1_goals: 2, user2_goals: 1,
          actual_tic: "450", total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('450/900')).toBeInTheDocument();
    expect(screen.getByText('Time:')).toBeInTheDocument();
  });

  it('muestra correctamente valores cero en el marcador', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          team1: "Team A", team2: "Team B",
          user1_goals: 0, user2_goals: 0,
          actual_tic: "0", total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText('0/900')).toBeInTheDocument();
  });

  it('actualiza el marcador cuando cambian los props', () => {
    const { rerender } = render(
      <svg>
        <Scoreboard estado_partido={{
          team1: "Team A", team2: "Team B",
          user1_goals: 1, user2_goals: 0,
          actual_tic: "100", total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('100/900')).toBeInTheDocument();

    rerender(
      <svg>
        <Scoreboard estado_partido={{
          team1: "Team A", team2: "Team B",
          user1_goals: 4, user2_goals: 2,
          actual_tic: "500", total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('500/900')).toBeInTheDocument();
    expect(screen.queryByText('100/900')).not.toBeInTheDocument();
  });

  it('mantiene separados los nombres de los equipos y sus respectivos goles', () => {
    render(
      <svg>
        <Scoreboard estado_partido={{
          team1: "Barcelona", team2: "Real Madrid",
          user1_goals: 7, user2_goals: 4,
          actual_tic: "800", total_tic: "900"
        }} />
      </svg>
    );

    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    expect(screen.getByText('Real Madrid')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    expect(screen.queryByText('Barcelona7')).not.toBeInTheDocument();
    expect(screen.queryByText('Real Madrid4')).not.toBeInTheDocument();
  });

  it('dibuja el fondo del marcador y los cuadros negros', () => {
    const { container } = render(
      <svg>
        <Scoreboard estado_partido={{
          team1: "Team A", team2: "Team B",
          user1_goals: 0, user2_goals: 0,
          actual_tic: "0", total_tic: "900"
        }} />
      </svg>
    );

    expect(container.querySelectorAll('rect')).toHaveLength(3);
  });

});