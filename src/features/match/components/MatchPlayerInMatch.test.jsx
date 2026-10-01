import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MatchPlayerInMatch } from './MatchPlayerInMatch';

describe('MatchPlayerInMatch', () => {

  it('muestra solamente los jugadores que están en cancha', () => {
    const players = [
      { player_id: 1, x: 5, y: 10, team: 1, Formation: '1', onPitch: true },
      { player_id: 2, x: 10, y: 15, team: 1, Formation: '2', onPitch: false }
    ];

    render(
      <svg>
        <MatchPlayerInMatch players={players} />
      </svg>
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('muestra correctamente la formación de los jugadores en cancha', () => {
    const players = [
      { player_id: 1, x: 5, y: 10, team: 1, Formation: '3', onPitch: true },
      { player_id: 2, x: 20, y: 5, team: 2, Formation: '7', onPitch: true }
    ];

    render(
      <svg>
        <MatchPlayerInMatch players={players} />
      </svg>
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('usa azul para los jugadores del equipo 1 y rojo para los jugadores del equipo 2', () => {
    const players = [
      { player_id: 1, x: 5, y: 10, team: 1, Formation: '1', onPitch: true },
      { player_id: 2, x: 20, y: 5, team: 2, Formation: '2', onPitch: true }
    ];

    const { container } = render(
      <svg>
        <MatchPlayerInMatch players={players} />
      </svg>
    );

    const groups = container.querySelectorAll('g');

    expect(groups).toHaveLength(2);
    expect(groups[0].querySelector('circle')).toHaveAttribute('fill', 'blue');
    expect(groups[1].querySelector('circle')).toHaveAttribute('fill', 'red');
  });

  it('calcula la posición del jugador usando el centro de la celda', () => {
    const players = [
      { player_id: 1, x: 5.8, y: 10.3, team: 1, Formation: '1', onPitch: true }
    ];

    const { container } = render(
      <svg>
        <MatchPlayerInMatch players={players} />
      </svg>
    );

    const circle = container.querySelector('circle');

    // Math.floor(5.8) + 0.5 = 5.5
    // Math.floor(10.3) + 0.5 = 10.5
    const expectedX = 300 + (5.5 / 40) * 1320;
    const expectedY = 150 + (10.5 / 20) * 800;

    expect(circle).toHaveAttribute('cx', String(expectedX));
    expect(circle).toHaveAttribute('cy', String(expectedY));
  });

  it('no rompe si no hay jugadores', () => {
    const { container } = render(
      <svg>
        <MatchPlayerInMatch players={[]} />
      </svg>
    );

    expect(container.querySelectorAll('circle')).toHaveLength(0);
  });

  it('no dibuja un jugador si onPitch no viene definido', () => {
    const players = [
      { player_id: 1, x: 5, y: 10, team: 1, Formation: '1' } // sin onPitch
    ];

    const { container } = render(
      <svg>
        <MatchPlayerInMatch players={players} />
      </svg>
    );

    expect(container.querySelectorAll('circle')).toHaveLength(0);
  });

  it('usa rojo por defecto si no viene el equipo (comportamiento actual, a revisar)', () => {
    const players = [
      { player_id: 1, x: 5, y: 10, Formation: '1', onPitch: true } // sin team
    ];

    const { container } = render(
      <svg>
        <MatchPlayerInMatch players={players} />
      </svg>
    );

    expect(container.querySelector('circle')).toHaveAttribute('fill', 'red');
  });

});