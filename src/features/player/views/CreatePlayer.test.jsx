import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CreatePlayer } from './CreatePlayer';
import * as api from '../api';
import { useNavigate } from 'react-router-dom';

// 1. Interceptamos la capa de red
vi.mock('../api');

// 2. Interceptamos el enrutador
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('CreatePlayer View', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it('navega al listado de jugadores al cancelar', async () => {
    const user = userEvent.setup();
    render(<CreatePlayer />);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/club/players');
  });

  it('envía los datos al backend y navega al listado en caso de éxito', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'createPlayer').mockResolvedValue({ player_id: 1, name: 'Test' });
    render(<CreatePlayer />);

    // Completamos el formulario (solo el nombre, los atributos por defecto ya suman 300)
    await user.type(screen.getByLabelText(/Nombre del Jugador/i), 'Nuevo Talento');
    
    // Disparamos el submit
    const submitBtn = screen.getByRole('button', { name: /Crear Jugador/i });
    await user.click(submitBtn);

    expect(api.createPlayer).toHaveBeenCalledTimes(1);
    expect(api.createPlayer).toHaveBeenCalledWith({
      name: 'Nuevo Talento',
      power: 60,
      agility: 60,
      control: 60,
      speed: 60,
      strength: 60
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/club/players', {
        state: { successMessage: 'El jugador Nuevo Talento fue creado exitosamente.' }
      });
    });
  });

  it('muestra un mensaje de error y no navega si el backend rechaza la petición', async () => {
    const user = userEvent.setup();
    const serverError = new Error('La validación falló en el servidor');
    vi.spyOn(api, 'createPlayer').mockRejectedValue(serverError);
    
    render(<CreatePlayer />);

    await user.type(screen.getByLabelText(/Nombre del Jugador/i), 'Jugador Fallido');
    await user.click(screen.getByRole('button', { name: /Crear Jugador/i }));

    // Verificamos que la UI captura y renderiza el error
    await waitFor(() => {
      expect(screen.getByText('Error al procesar la solicitud:')).toBeInTheDocument();
      expect(screen.getByText('La validación falló en el servidor')).toBeInTheDocument();
    });

    // Verificamos que NO haya redirección
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('deshabilita los botones mientras la petición está en curso (isLoading)', async () => {
    const user = userEvent.setup();
    
    let resolveApi;
    const pendingPromise = new Promise((resolve) => { resolveApi = resolve; });
    vi.spyOn(api, 'createPlayer').mockReturnValue(pendingPromise);
    
    render(<CreatePlayer />);

    await user.type(screen.getByLabelText(/Nombre del Jugador/i), 'Jugador Lento');
    const submitBtn = screen.getByRole('button', { name: /Crear Jugador/i });
    
    await user.click(submitBtn);

    expect(screen.getByRole('button', { name: /Creando.../i })).toBeDisabled();
    
    // Envolvemos la resolución en act para esperar las actualizaciones asíncronas de estado
    await act(async () => {
      resolveApi({ player_id: 1 });
    });
  });
});