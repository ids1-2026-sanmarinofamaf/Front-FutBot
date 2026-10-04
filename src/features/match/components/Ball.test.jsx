import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Ball } from './Ball';

describe('Ball', () => {

  it('calcula la posición de la pelota usando el centro de la celda', () => {
    const { container } = render(
      <svg>
        <Ball ball={{ x: 20.7, y: 10.2 }} />
      </svg>
    );

    const circle = container.querySelector('circle');

    // Math.floor(20.7) + 0.5 = 20.5
    // Math.floor(10.2) + 0.5 = 10.5
    const expectedX = 300 + (20.5 / 40) * 1320;
    const expectedY = 150 + (10.5 / 20) * 800;

    expect(circle).toHaveAttribute('cx', String(expectedX));
    expect(circle).toHaveAttribute('cy', String(expectedY));
  });

  it('usa el color y radio esperados', () => {
    const { container } = render(
      <svg>
        <Ball ball={{ x: 20, y: 10 }} />
      </svg>
    );

    const circle = container.querySelector('circle');

    expect(circle).toHaveAttribute('fill', 'white');
    expect(circle).toHaveAttribute('stroke', 'black');
    expect(circle).toHaveAttribute('r', '3.3');
  });

  it('calcula bien la posición cuando la coordenada ya es un número entero', () => {
    const { container } = render(
      <svg>
        <Ball ball={{ x: 20, y: 10 }} />
      </svg>
    );

    const circle = container.querySelector('circle');

    // Math.floor(20) + 0.5 = 20.5 (igual que si fuera 20.9)
    const expectedX = 300 + (20.5 / 40) * 1320;
    const expectedY = 150 + (10.5 / 20) * 800;

    expect(circle).toHaveAttribute('cx', String(expectedX));
    expect(circle).toHaveAttribute('cy', String(expectedY));
  });

  it('calcula correctamente la posición en el borde de la cancha (x=0, y=0)', () => {
    const { container } = render(
      <svg>
        <Ball ball={{ x: 0, y: 0 }} />
      </svg>
    );

    const circle = container.querySelector('circle');

    // Math.floor(0) + 0.5 = 0.5
    const expectedX = 300 + (0.5 / 40) * 1320;
    const expectedY = 150 + (0.5 / 20) * 800;

    expect(circle).toHaveAttribute('cx', String(expectedX));
    expect(circle).toHaveAttribute('cy', String(expectedY));
  });

  it('solo dibuja un círculo', () => {
    const { container } = render(
      <svg>
        <Ball ball={{ x: 20, y: 10 }} />
      </svg>
    );

    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });

});