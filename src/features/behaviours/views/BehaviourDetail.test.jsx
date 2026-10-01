import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BehaviourDetail } from './BehaviourDetail';
import * as api from '../api';
import { useParams, useNavigate } from 'react-router-dom';

// Interceptamos dependencias externas
vi.mock('../api');
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

describe('BehaviourDetail UI', () => {
  const mockId = '1';
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Configuramos los mocks de las rutas antes de cada test
    useParams.mockReturnValue({ id: mockId });
    useNavigate.mockReturnValue(mockNavigate);
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
    // Ya no se pasan props, el componente las obtiene del hook useParams
    render(<BehaviourDetail />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('def start_press(): return True')).toBeInTheDocument();
      expect(screen.getByText('PresionAlta')).toBeInTheDocument();
    });
  });

  it('renderiza el mensaje de error si la petición falla', async () => {
    // Arrange
    const errorMessage = 'No se encontró el comportamiento';
    vi.spyOn(api, 'getBehaviourById').mockRejectedValue(new Error(errorMessage));

    // Act
    render(<BehaviourDetail />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('ejecuta la navegación al listado al hacer clic en volver en estado de error', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.spyOn(api, 'getBehaviourById').mockRejectedValue(new Error('Error de red'));

    render(<BehaviourDetail />);

    // Act
    const backButton = await screen.findByRole('button', { name: /volver al listado/i });
    await user.click(backButton);

    // Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club/behaviours');
  });
});