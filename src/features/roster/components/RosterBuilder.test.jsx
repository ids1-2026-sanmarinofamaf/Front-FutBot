import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { RosterBuilder } from './RosterBuilder';
import * as playerApi from '../../player/api';
import * as behaviorApi from '../../behaviors/api';

// Interceptamos la capa de red de ambos módulos
vi.mock('../../player/api');
vi.mock('../../behaviors/api');

describe('RosterBuilder', () => {
  const mockSubmit = vi.fn();
  const mockCancel = vi.fn();

  // Datos mockeados mínimos para armar una plantilla completa
  const mockPlayers = [
    { player_id: 1, name: 'Jugador 1' },
    { player_id: 2, name: 'Jugador 2' },
    { player_id: 3, name: 'Jugador 3' },
    { player_id: 4, name: 'Jugador 4' },
    { player_id: 5, name: 'Jugador 5' },
    { player_id: 6, name: 'Jugador 6' },
    { player_id: 7, name: 'Jugador 7' },
  ];

  const mockBehaviors = [
    { behavior_id: 10, name: 'Ofensivo', is_valid: true },
    { behavior_id: 20, name: 'Defensivo', is_valid: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Uso correcto de vi.spyOn para interceptar funciones de módulos
    vi.spyOn(playerApi, 'getPlayers').mockResolvedValue(mockPlayers);
    vi.spyOn(behaviorApi, 'getBehaviors').mockResolvedValue(mockBehaviors);
  });

  it('muestra el estado de carga y luego renderiza el formulario', async () => {
    render(<RosterBuilder onSubmit={mockSubmit} />);

    expect(screen.getByText(/Cargando recursos del club/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Configurar Plantilla')).toBeInTheDocument();
    });
  });

  it('muestra mensaje de error si falla la carga de datos', async () => {
    // Intercepción específica para test de fallo
    vi.spyOn(playerApi, 'getPlayers').mockRejectedValue(new Error('Fallo de red'));

    render(<RosterBuilder onSubmit={mockSubmit} />);

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar datos del club. Fallo de red/i)).toBeInTheDocument();
    });
  });

  it('deshabilita el botón de confirmación si la plantilla está incompleta', async () => {
    render(<RosterBuilder onSubmit={mockSubmit} />);
    
    await waitFor(() => {
      expect(screen.getByText('Configurar Plantilla')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Confirmar Plantilla/i });
    expect(submitBtn).toBeDisabled();
  });

  it('deshabilita la opción de un jugador si ya fue seleccionado en otro slot', async () => {
    const user = userEvent.setup();
    render(<RosterBuilder onSubmit={mockSubmit} />);
    
    await waitFor(() => {
      expect(screen.getByText('Configurar Plantilla')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const starter1Select = selects[1]; 
    const starter2Select = selects[3]; 

    await user.selectOptions(starter1Select, '1');

    const optionInSlot2 = within(starter2Select).getByRole('option', { name: 'Jugador 1' });
    expect(optionInSlot2).toBeDisabled();
  });

  it('permite enviar el formulario y emite el payload correcto cuando todo está completo', async () => {
    const user = userEvent.setup();
    render(<RosterBuilder onSubmit={mockSubmit} />);
    
    await waitFor(() => {
      expect(screen.getByText('Configurar Plantilla')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');

    // Llenar Formación
    await user.selectOptions(selects[0], 'ofensiva');

    // Llenar Titulares
    await user.selectOptions(selects[1], '1'); 
    await user.selectOptions(selects[2], '10'); 
    
    await user.selectOptions(selects[3], '2'); 
    await user.selectOptions(selects[4], '20'); 
    
    await user.selectOptions(selects[5], '3'); 
    await user.selectOptions(selects[6], '10'); 

    // Llenar Suplentes
    await user.selectOptions(selects[7], '4'); 
    await user.selectOptions(selects[8], '5'); 
    await user.selectOptions(selects[9], '6'); 

    const submitBtn = screen.getByRole('button', { name: /Confirmar Plantilla/i });
    
    expect(submitBtn).not.toBeDisabled();

    await user.click(submitBtn);

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith({
      formation: 'ofensiva',
      players: [
        { player_id: 1, is_starter: true, slot: 'starter_1', initial_behavior_id: 10 },
        { player_id: 2, is_starter: true, slot: 'starter_2', initial_behavior_id: 20 },
        { player_id: 3, is_starter: true, slot: 'starter_3', initial_behavior_id: 10 },
        { player_id: 4, is_starter: false, slot: null, initial_behavior_id: null },
        { player_id: 5, is_starter: false, slot: null, initial_behavior_id: null },
        { player_id: 6, is_starter: false, slot: null, initial_behavior_id: null },
      ]
    });
  });

  it('ejecuta onCancel al hacer clic en el botón Cancelar', async () => {
    const user = userEvent.setup();
    render(<RosterBuilder onSubmit={mockSubmit} onCancel={mockCancel} />);
    
    await waitFor(() => {
      expect(screen.getByText('Configurar Plantilla')).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);

    expect(mockCancel).toHaveBeenCalledTimes(1);
  });
});