import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BehaviourList } from './BehaviourList';
import * as api from '../api';

// Interceptamos la capa de red
vi.mock('../api');

// Aislamos BehaviourDetail para que no ejecute lógica en este ticket
vi.mock('./BehaviourDetail', () => ({
  BehaviourDetail: () => null,
}));

describe('BehaviourList UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    // 1. Arrange: payload sin 'code', respetando el contrato optimizado
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
});