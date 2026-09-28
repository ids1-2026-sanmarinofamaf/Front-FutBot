import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BehaviourDetail } from './BehaviourDetail';
import * as api from '../api';

vi.mock('../api');

describe('BehaviourDetail UI', () => {
  const mockId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el código y nombre del comportamiento correctamente', async () => {
    // Arrange
    const mockResponse = { 
      behaviour_id: mockId, 
      name: 'PresionAlta', 
      code: 'def start_press():\n    return True',
      is_valid: true
    };
    vi.spyOn(api, 'getBehaviourById').mockResolvedValue(mockResponse);

    // Act
    render(<BehaviourDetail id={mockId} />);

    // Assert
    await waitFor(() => {
      // Testing Library normaliza los saltos de línea al buscar texto
      expect(screen.getByText('def start_press(): return True')).toBeInTheDocument();
      expect(screen.getByText('PresionAlta')).toBeInTheDocument();
    });
  });

  it('renderiza el mensaje de error si la petición falla', async () => {
    // Arrange
    const errorMessage = 'No se encontró el comportamiento';
    vi.spyOn(api, 'getBehaviourById').mockRejectedValue(new Error(errorMessage));

    // Act
    render(<BehaviourDetail id={mockId} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('ejecuta la función onBack al hacer clic en volver en estado de error', async () => {
    // Arrange
    vi.spyOn(api, 'getBehaviourById').mockRejectedValue(new Error('Error de red'));
    const onBackMock = vi.fn();

    // Act
    render(<BehaviourDetail id={mockId} onBack={onBackMock} />);

    // Assert
    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /volver/i });
      backButton.click();
      expect(onBackMock).toHaveBeenCalledTimes(1);
    });
  });
});