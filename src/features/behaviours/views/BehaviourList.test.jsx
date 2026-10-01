import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BehaviourList } from './BehaviourList';
import * as api from '../api';
import { useNavigate } from 'react-router-dom';

// Interceptamos la capa de red
vi.mock('../api');

// Interceptamos el enrutador
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('BehaviourList UI', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('muestra el mensaje de error cuando la API falla', async () => {
    // 1. Arrange
    const errorMessage = 'Fallo en la comunicación con el servidor';
    vi.spyOn(api, 'getBehaviours').mockRejectedValue(new Error(errorMessage));

    // 2. Act
    render(<BehaviourList />);

    // 3. Assert
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('renderiza la lista de comportamientos correctamente', async () => {
    // 1. Arrange
    const mockData = [
      { behaviour_id: 1, name: 'Ofensivo', is_valid: true },
      { behaviour_id: 2, name: 'Pasivo', is_valid: false }
    ];
    vi.spyOn(api, 'getBehaviours').mockResolvedValue(mockData);

    // 2. Act
    render(<BehaviourList />);

    // 3. Assert
    await waitFor(() => {
      expect(screen.getByText('Ofensivo')).toBeInTheDocument();
      expect(screen.getByText('Válido')).toBeInTheDocument();

      expect(screen.getByText('Pasivo')).toBeInTheDocument();
      expect(screen.getByText('Inválido')).toBeInTheDocument();
    });
  });

  it('navega al detalle del comportamiento al hacer clic en "Ver"', async () => {
    // 1. Arrange
    const user = userEvent.setup();
    const mockData = [{ behaviour_id: 5, name: 'Táctica Test', is_valid: true }];
    vi.spyOn(api, 'getBehaviours').mockResolvedValue(mockData);
    
    render(<BehaviourList />);

    // Esperamos a que la tarjeta se renderice.
    const viewButton = await screen.findByRole('button', { name: 'Ver' });
    
    // 2. Act
    await user.click(viewButton);

    // 3. Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club/behaviours/5');
  });

  it('navega a "/club" al hacer clic en "Volver a Mi Club"', async () => {
    // 1. Arrange
    const user = userEvent.setup();
    vi.spyOn(api, 'getBehaviours').mockResolvedValue([]); // Una respuesta vacía es suficiente
    
    render(<BehaviourList />);

    // Esperamos a que se resuelva la promesa y se renderice el botón de retroceso
    const backButton = await screen.findByRole('button', { name: /volver a mi club/i });
    
    // 2. Act
    await user.click(backButton);

    // 3. Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club');
  });
});