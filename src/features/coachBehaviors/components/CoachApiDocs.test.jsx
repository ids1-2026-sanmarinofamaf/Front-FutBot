/**
 * Tests unitarios para el componente CoachApiDocs.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoachApiDocs } from './CoachApiDocs';
import { COACH_API_CATEGORIES } from '../coachApiData';

describe('CoachApiDocs Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<CoachApiDocs isOpen={false} onClose={mockOnClose} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/Manual de comportamientos de DT/i)).not.toBeInTheDocument();
  });

  it('renderiza el encabezado y las reglas de ejecución cuando isOpen es true', () => {
    render(<CoachApiDocs isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Manual de comportamientos de DT/i)).toBeInTheDocument();
    expect(screen.getByText(/Reglas de ejecución/i)).toBeInTheDocument();
    expect(screen.getByText(/def coach\(\):/i)).toBeInTheDocument();
    expect(screen.getAllByText(/substitute\(player_out_id, player_in_id\)/i).length).toBeGreaterThan(0);
  });

  it('incluye las primitivas de sustitución bench, can_substitute y substitute', () => {
    render(<CoachApiDocs isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('bench() -> list[int]')).toBeInTheDocument();
    expect(screen.getByText('can_substitute() -> bool')).toBeInTheDocument();
    expect(
      screen.getByText('substitute(player_out_id: int, player_in_id: int) -> Substitution')
    ).toBeInTheDocument();
  });

  it('renderiza todas las categorías y primitivas definidas en COACH_API_CATEGORIES', () => {
    render(<CoachApiDocs isOpen={true} onClose={mockOnClose} />);

    COACH_API_CATEGORIES.forEach((category) => {
      expect(screen.getByText(category.title)).toBeInTheDocument();
      category.items.forEach((item) => {
        expect(screen.getAllByText(item.signature).length).toBeGreaterThan(0);
      });
    });
  });

  it('llama a onClose al hacer clic en el botón Cerrar', () => {
    render(<CoachApiDocs isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /Cerrar/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

