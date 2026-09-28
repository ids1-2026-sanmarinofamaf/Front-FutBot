import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BehaviourList } from './BehaviourList';
import * as api from '../api';

// Se intercepta el módulo de la capa de dominio
vi.mock('../api');

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
    // Se utiliza waitFor porque el renderizado inicial es "loading" y luego pasa a "error" asíncronamente
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('renderiza la lista de comportamientos correctamente', async () => {
    // 1. Arrange
    const mockData = [
      { behaviour_id: 1, name: 'Ofensivo', code: 'kick()', is_valid: true },
      { behaviour_id: 2, name: 'Pasivo', code: 'wait()', is_valid: false }
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