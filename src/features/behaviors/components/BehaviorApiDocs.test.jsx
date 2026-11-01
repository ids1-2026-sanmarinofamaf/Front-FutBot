import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BehaviorApiDocs } from './BehaviorApiDocs';
import { API_CATEGORIES } from '../behaviorApiData';

describe('BehaviorApiDocs Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<BehaviorApiDocs isOpen={false} onClose={mockOnClose} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/Manual de comportamientos/i)).not.toBeInTheDocument();
  });

  it('renderiza el encabezado y las reglas de ejecución cuando isOpen es true', () => {
    render(<BehaviorApiDocs isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Manual de comportamientos/i)).toBeInTheDocument();
    expect(screen.getByText(/Reglas de ejecución/i)).toBeInTheDocument();
    expect(screen.getByText(/def play\(\):/i)).toBeInTheDocument();
  });

  it('renderiza todas las categorías y primitivas definidas en API_CATEGORIES', () => {
    render(<BehaviorApiDocs isOpen={true} onClose={mockOnClose} />);

    API_CATEGORIES.forEach((category) => {
      expect(screen.getByText(category.title)).toBeInTheDocument();
      category.items.forEach((item) => {
        expect(screen.getAllByText(item.signature).length).toBeGreaterThan(0);
      });
    });
  });

  it('llama a onClose al hacer clic en el botón Cerrar', () => {
    render(<BehaviorApiDocs isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /Cerrar/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

