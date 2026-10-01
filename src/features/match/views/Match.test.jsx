import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Match } from './Match';

describe('Match', () => {

  const estado_partido = {
    actual_tic: 450,
    total_tic: 900,
    user1_goals: 99,
    user2_goals: 88,
    ball: { x: 20, y: 10 },
    players: [
      { player_id: 1, x: 5, y: 10, team: 1, onPitch: true, Formation: '1', Name: 'Player 1' },
      { player_id: 2, x: 10, y: 5, team: 1, onPitch: true, Formation: '2', Name: 'Player 2' },
      { player_id: 3, x: 15, y: 8, team: 1, onPitch: true, Formation: '3', Name: 'Player 3' },
      { player_id: 4, x: 8, y: 14, team: 1, onPitch: false, Formation: '4', Name: 'Player 4' },
      { player_id: 5, x: 12, y: 16, team: 1, onPitch: false, Formation: '5', Name: 'Player 5' },
      { player_id: 6, x: 18, y: 3, team: 1, onPitch: false, Formation: '6', Name: 'Player 6' },
      { player_id: 7, x: 20, y: 12, team: 2, onPitch: true, Formation: '1', Name: 'Player 7' },
      { player_id: 8, x: 25, y: 15, team: 2, onPitch: true, Formation: '2', Name: 'Player 8' },
      { player_id: 9, x: 30, y: 10, team: 2, onPitch: true, Formation: '3', Name: 'Player 9' },
      { player_id: 10, x: 28, y: 4, team: 2, onPitch: false, Formation: '4', Name: 'Player 10' },
      { player_id: 11, x: 33, y: 6, team: 2, onPitch: false, Formation: '5', Name: 'Player 11' },
      { player_id: 12, x: 35, y: 17, team: 2, onPitch: false, Formation: '6', Name: 'Player 12' },
    ]
  };

  it('dibuja un círculo por cada jugador en cancha de ambos equipos, más la pelota', () => {
    const { container } = render(<Match estado_partido={estado_partido} />);

    // player_id 1,2,3 (team 1) + 7,8,9 (team 2) con onPitch:true = 6 titulares + 1 pelota + centro de la cancha = 8 círculos
    expect(container.querySelectorAll('circle')).toHaveLength(8);
  });

  it('muestra el marcador con los goles y el tiempo correctos', () => {
    const { getByText } = render(<Match estado_partido={estado_partido} />);

    expect(getByText('99')).toBeInTheDocument();
    expect(getByText('88')).toBeInTheDocument();
    expect(getByText('450/900')).toBeInTheDocument();
  });

  it('muestra los nombres por defecto de los equipos en el marcador', () => {
    const { getByText } = render(<Match estado_partido={estado_partido} />);

    expect(getByText('Team 1')).toBeInTheDocument();
    expect(getByText('Team 2')).toBeInTheDocument();
  });

  it('muestra los nombres de los 12 jugadores (titulares y suplentes de ambos equipos) en MatchPlayerOut', () => {
    const { getByText } = render(<Match estado_partido={estado_partido} />);

    estado_partido.players.forEach(function (p) {
      expect(getByText(p.Name)).toBeInTheDocument();
    });
  });

  it('dibuja la cancha (SoccerField) junto con los jugadores y el marcador', () => {
    const { container } = render(<Match estado_partido={estado_partido} />);

    expect(container.querySelectorAll('line').length).toBeGreaterThan(0);
  });

  it('no rompe si estado_partido llega solo con lo que manda el WebSocket (sin datos de alineación)', () => {
    const minimalState = {
      actual_tic: 9,
      total_tic: 900,
      user1_goals: 0,
      user2_goals: 0,
      ball: { x: 20, y: 10 },
      players: [
        { player_id: 1, x: 5, y: 10 },
        { player_id: 2, x: 10, y: 5 },
        { player_id: 3, x: 15, y: 8 },
        { player_id: 4, x: 20, y: 12 },
        { player_id: 5, x: 25, y: 15 },
        { player_id: 6, x: 30, y: 10 },
        { player_id: 7, x: 18, y: 3 },
        { player_id: 8, x: 8, y: 14 },
        { player_id: 9, x: 12, y: 16 },
        { player_id: 10, x: 28, y: 4 },
        { player_id: 11, x: 33, y: 6 },
        { player_id: 12, x: 35, y: 17 }
      ]
    };

    expect(function () { render(<Match estado_partido={minimalState} />) }).not.toThrow();
  });

  it('actualiza jugadores y marcador cuando cambia estado_partido', () => {
    const result = render(<Match estado_partido={estado_partido} />);

    expect(result.getByText('99')).toBeInTheDocument();

    const updatedState = {
      actual_tic: 500,
      total_tic: 900,
      user1_goals: 77,
      user2_goals: 88,
      ball: estado_partido.ball,
      players: estado_partido.players
    };

    result.rerender(<Match estado_partido={updatedState} />);

    expect(result.getByText('77')).toBeInTheDocument();
    expect(result.getByText('500/900')).toBeInTheDocument();
  });

});