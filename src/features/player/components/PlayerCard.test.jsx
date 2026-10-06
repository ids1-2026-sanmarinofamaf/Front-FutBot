import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { PlayerCard } from './PlayerCard';

describe('PlayerCard UI', () => {
  // Objeto mock diseñado para probar los tres rangos de colores posibles
  const mockPlayer = {
    player_id: 99,
    name: 'Andy Martínez',
    power: 85,     // Rango Excelente (>= 75)
    agility: 60,   // Rango Promedio (45 - 74)
    control: 30,   // Rango Deficiente (<= 44)
    speed: 75,     // Límite exacto Excelente
    strength: 50   // Rango Promedio
  };

  it('renderiza el nombre y los atributos del jugador correctamente', () => {
    // Arrange & Act
    render(<PlayerCard player={mockPlayer} />);

    // Assert
    expect(screen.getByText('Andy Martínez')).toBeInTheDocument();
    
    // Verificamos que se renderizan las etiquetas (labels)
    expect(screen.getByText('pow')).toBeInTheDocument();
    expect(screen.getByText('agi')).toBeInTheDocument();
    expect(screen.getByText('con')).toBeInTheDocument();
    expect(screen.getByText('spe')).toBeInTheDocument();
    expect(screen.getByText('str')).toBeInTheDocument();

    // Verificamos que se renderizan los valores
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('aplica las clases de color correctas basadas en el valor del atributo (Color Coding)', () => {
    // Arrange & Act
    render(<PlayerCard player={mockPlayer} />);

    // Assert
    // Atributo Excelente (>= 75) -> Verde (emerald)
    const powerValue = screen.getByText('85');
    expect(powerValue).toHaveClass('text-emerald-400');

    // Atributo Promedio (45 - 74) -> Gris (slate)
    const agilityValue = screen.getByText('60');
    expect(agilityValue).toHaveClass('text-slate-300');

    // Atributo Deficiente (<= 44) -> Rojo (red)
    const controlValue = screen.getByText('30');
    expect(controlValue).toHaveClass('text-red-400');
  });

  {/** Test para proximo sprint

    it('ejecuta la función onView con el player_id correcto al hacer clic en "Ver"', async () => {
      // Arrange
      const user = userEvent.setup();
      const onViewMock = vi.fn();
      render(<PlayerCard player={mockPlayer} onView={onViewMock} />);

      // Act
      const viewButton = screen.getByRole('button', { name: /Ver/i });
      await user.click(viewButton);

      // Assert
      expect(onViewMock).toHaveBeenCalledTimes(1);
      expect(onViewMock).toHaveBeenCalledWith(99); // El ID de mockPlayer
    });
   */}
});