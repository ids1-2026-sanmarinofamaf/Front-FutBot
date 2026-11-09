import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Match } from './Match'
import { getPlayerById } from '../../player/api.js'
import { getBehaviors } from '../../behaviors/api.js'
import { changeBehavior, makeSubstitution } from '../api.js'

vi.mock('../../player/api.js', () => ({
  getPlayerById: vi.fn()
}))

vi.mock('../../behaviors/api.js', () => ({
  getBehaviors: vi.fn()
}))

vi.mock('../api.js', () => ({
  changeBehavior: vi.fn(),
  makeSubstitution: vi.fn()
}))

const defaultMatchInfo = {
  match_id: 42,
  my_club_id: 1,
  team_a: {
    club_id: 1,
    club_name: 'team 1',
    coach_behavior_name: 'Coach A',
  },
  team_b: {
    club_id: 2,
    club_name: 'team 2',
    coach_behavior_name: 'Coach B',
  },
  players: [
    { player_id: 1, name: 'Player 1', shirt_number: 1, club_id: 1, team: 'A' },
    { player_id: 2, name: 'Player 2', shirt_number: 2, club_id: 1, team: 'A' },
    { player_id: 3, name: 'Player 3', shirt_number: 3, club_id: 1, team: 'A' },
    { player_id: 4, name: 'Player 4', shirt_number: 4, club_id: 1, team: 'A' },
    { player_id: 5, name: 'Player 5', shirt_number: 5, club_id: 1, team: 'A' },
    { player_id: 6, name: 'Player 6', shirt_number: 6, club_id: 1, team: 'A' },
    { player_id: 7, name: 'Rival', shirt_number: 1, club_id: 2, team: 'B' },
    { player_id: 8, name: 'Rival', shirt_number: 2, club_id: 2, team: 'B' },
    { player_id: 9, name: 'Rival', shirt_number: 3, club_id: 2, team: 'B' },
    { player_id: 10, name: 'Rival', shirt_number: 4, club_id: 2, team: 'B' },
    { player_id: 11, name: 'Rival', shirt_number: 5, club_id: 2, team: 'B' },
    { player_id: 12, name: 'Rival', shirt_number: 6, club_id: 2, team: 'B' },
  ],
}

function renderMatch(estado_partido, matchId = '42', pausa = null, matchInfo = defaultMatchInfo) {
  return render(
    <MemoryRouter>
      <Match
        estado_partido={estado_partido}
        matchId={matchId}
        pausa={pausa}
        matchInfo={matchInfo}
      />
    </MemoryRouter>
  )
}

describe('Match', () => {

  const estado_partido = {
    actual_tic: 450,
    total_tic: 900,
    user1_goals: 99,
    user2_goals: 88,
    ball: {
      x: 20,
      y: 10
    },
    players: [
      { player_id: 1, x: 5, y: 10, team: 'A', is_on_field: true },
      { player_id: 2, x: 10, y: 5, team: 'A', is_on_field: true },
      { player_id: 3, x: 15, y: 8, team: 'A', is_on_field: true },
      { player_id: 4, x: 8, y: 14, team: 'A', is_on_field: false },
      { player_id: 5, x: 12, y: 16, team: 'A', is_on_field: false },
      { player_id: 6, x: 18, y: 3, team: 'A', is_on_field: false },

      { player_id: 7, x: 20, y: 12, team: 'B', is_on_field: true },
      { player_id: 8, x: 25, y: 15, team: 'B', is_on_field: true },
      { player_id: 9, x: 30, y: 10, team: 'B', is_on_field: true },
      { player_id: 10, x: 28, y: 4, team: 'B', is_on_field: false },
      { player_id: 11, x: 33, y: 6, team: 'B', is_on_field: false },
      { player_id: 12, x: 35, y: 17, team: 'B', is_on_field: false }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dibuja los jugadores, la pelota, el círculo central y los postes', () => {
    const { container } = renderMatch(estado_partido)

    expect(container.querySelectorAll('circle')).toHaveLength(12)
  })

  it('muestra el marcador con los goles y el tiempo correctos', () => {
    renderMatch(estado_partido)

    expect(screen.getByText('99')).toBeInTheDocument()
    expect(screen.getByText('88')).toBeInTheDocument()
    expect(screen.getByText('45/90sec')).toBeInTheDocument()
  })

  it('muestra los nombres por defecto de los equipos en el marcador', () => {
    renderMatch(estado_partido)

    expect(screen.getByText('team 1')).toBeInTheDocument()
    expect(screen.getByText('team 2')).toBeInTheDocument()
  })

  it('muestra los nombres del equipo propio y "Rival" para el equipo contrario', async () => {
    renderMatch(estado_partido)

    expect(await screen.findByText('Player 1')).toBeInTheDocument()
    expect(await screen.findByText('Player 2')).toBeInTheDocument()
    expect(await screen.findByText('Player 3')).toBeInTheDocument()
    expect(await screen.findByText('Player 4')).toBeInTheDocument()
    expect(await screen.findByText('Player 5')).toBeInTheDocument()
    expect(await screen.findByText('Player 6')).toBeInTheDocument()

    expect(await screen.findAllByText('Rival')).toHaveLength(6)

    expect(getPlayerById).not.toHaveBeenCalled()
  })

  it('dibuja la cancha junto con el resto de los elementos del partido', () => {
    const { container } = renderMatch(estado_partido)

    expect(container.querySelectorAll('line').length).toBeGreaterThan(0)
  })

  it('acepta el estado del partido con 6 jugadores por equipo', () => {
    expect(estado_partido.players).toHaveLength(12)

    const teamA = estado_partido.players.filter(function (player) {
      return player.team === 'A'
    })

    const teamB = estado_partido.players.filter(function (player) {
      return player.team === 'B'
    })

    expect(teamA).toHaveLength(6)
    expect(teamB).toHaveLength(6)

    expect(function () {
      renderMatch(estado_partido)
    }).not.toThrow()
  })

  it('actualiza el marcador cuando cambia estado_partido', () => {
    const result = renderMatch(estado_partido)

    expect(result.getByText('99')).toBeInTheDocument()
    expect(result.getByText('45/90sec')).toBeInTheDocument()

    const updatedState = {
      actual_tic: 500,
      total_tic: 900,
      user1_goals: 77,
      user2_goals: 88,
      ball: {
        x: 25,
        y: 12
      },
      players: estado_partido.players
    }

    result.rerender(
      <MemoryRouter>
        <Match
          estado_partido={updatedState}
          matchInfo={defaultMatchInfo}
        />
      </MemoryRouter>
    )

    expect(result.getByText('77')).toBeInTheDocument()
    expect(result.getByText('88')).toBeInTheDocument()
    expect(result.getByText('50/90sec')).toBeInTheDocument()

    expect(result.queryByText('45/90sec')).not.toBeInTheDocument()
  })

  it('muestra el botón para salir del partido', () => {
    renderMatch(estado_partido)

    expect(
      screen.getByRole('button', { name: 'Salir del partido' })
    ).toBeInTheDocument()
  })

  it('asigna el número correctamente por equipo, incluso si los jugadores vienen mezclados', async () => {
    const mixedState = {
      actual_tic: 1,
      total_tic: 900,
      user1_goals: 0,
      user2_goals: 0,
      ball: { x: 20, y: 10 },
      players: [
        { player_id: 7, x: 20, y: 12, team: 'B', is_on_field: true },
        { player_id: 1, x: 5, y: 10, team: 'A', is_on_field: true },
        { player_id: 8, x: 25, y: 15, team: 'B', is_on_field: true },
        { player_id: 2, x: 10, y: 5, team: 'A', is_on_field: true },
      ]
    }

    renderMatch(mixedState)

    await screen.findByText('Player 1')

    expect(screen.getAllByText('Number: 1')).toHaveLength(2)
    expect(screen.getAllByText('Number: 2')).toHaveLength(2)
  })

  it('abre el menú de cambio de comportamiento al clickear un titular propio, lista comportamientos y envía PUT al confirmar', async () => {
    getBehaviors.mockResolvedValue([
      { behavior_id: 1, name: 'Default', is_default: true },
      { behavior_id: 5, name: 'Ataque Total', is_default: false }
    ])
    changeBehavior.mockResolvedValue(null)

    renderMatch(estado_partido, '77')

    await screen.findByText('Player 1')

    fireEvent.click(screen.getByTestId('starter-card-1'))

    expect(
      await screen.findByRole('heading', { name: 'Cambiar comportamiento' })
    ).toBeInTheDocument()

    expect(await screen.findByRole('option', { name: /Default/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Ataque Total/i })).toBeInTheDocument()
    expect(getBehaviors).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('option', { name: /Ataque Total/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(function () {
      expect(changeBehavior).toHaveBeenCalledTimes(1)
      expect(changeBehavior).toHaveBeenCalledWith('77', 1, 5)
    })

    expect(screen.getByTestId('starter-behavior-1')).toHaveTextContent('Ataque Total')

    await waitFor(function () {
      expect(
        screen.queryByRole('heading', { name: 'Cambiar comportamiento' })
      ).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('starter-card-2'))

    expect(
      await screen.findByRole('heading', { name: 'Cambiar comportamiento' })
    ).toBeInTheDocument()
    expect(getBehaviors).toHaveBeenCalledTimes(1)
  })

  it('cierra el menú sin llamar a changeBehavior cuando el usuario cancela', async () => {
    getBehaviors.mockResolvedValue([
      { behavior_id: 1, name: 'Default', is_default: true }
    ])

    renderMatch(estado_partido, '77')

    await screen.findByText('Player 1')

    fireEvent.click(screen.getByTestId('starter-card-1'))

    expect(
      await screen.findByRole('heading', { name: 'Cambiar comportamiento' })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(
      screen.queryByRole('heading', { name: 'Cambiar comportamiento' })
    ).not.toBeInTheDocument()
    expect(changeBehavior).not.toHaveBeenCalled()
  })

  it('impide abrir el menú de comportamientos a un espectador o sobre jugadores rivales', async () => {
    const matchInfoSpectator = {
      my_club_id: null,
      players: estado_partido.players.map(p => ({
        player_id: p.player_id,
        name: 'Rival',
        club_id: p.team === 'A' ? 1 : 2,
        shirt_number: 1,
        team: p.team,
      })),
    }

    renderMatch(estado_partido, '77', null, matchInfoSpectator)

    expect(screen.getAllByText('Rival')).toHaveLength(12)

    fireEvent.click(screen.getByTestId('starter-card-1'))
    fireEvent.click(screen.getByTestId('starter-card-7'))

    expect(
      screen.queryByRole('heading', { name: 'Cambiar comportamiento' })
    ).not.toBeInTheDocument()
    expect(getBehaviors).not.toHaveBeenCalled()
  })

  // Tests de sustituciones

  it('abre el menú de suplentes al pulsar el botón Cambiar jugador', async () => {
    renderMatch(estado_partido)

    await screen.findByText('Player 1')

    fireEvent.click(screen.getByTestId('substitution-button-1'))

    expect(
      await screen.findByTestId('substitute-option-4')
    ).toBeInTheDocument()

    expect(
      screen.getByTestId('cancel-substitution-A')
    ).toBeInTheDocument()
  })

  it('envía la solicitud de sustitución con el titular y el suplente seleccionados', async () => {
    makeSubstitution.mockResolvedValue(null)

    renderMatch(estado_partido, '77')

    await screen.findByText('Player 1')

    fireEvent.click(screen.getByTestId('substitution-button-1'))

    fireEvent.click(await screen.findByTestId('substitute-option-4'))

    await waitFor(function () {
      expect(makeSubstitution).toHaveBeenCalledTimes(1)
      expect(makeSubstitution).toHaveBeenCalledWith('77', 1, 4)
    })
  })

  it('cambia el texto del botón del titular por el nombre del suplente seleccionado', async () => {
    makeSubstitution.mockResolvedValue(null)

    renderMatch(estado_partido, '77')

    await screen.findByText('Player 4')

    fireEvent.click(screen.getByTestId('substitution-button-1'))

    fireEvent.click(await screen.findByTestId('substitute-option-4'))

    await waitFor(function () {
      expect(
        screen.getByTestId('substitution-button-1')
      ).toHaveTextContent('Player 4')
    })

    expect(
      screen.getByTestId('substitution-button-2')
    ).toHaveTextContent('Cambiar jugador')
  })

  it('mantiene el nombre pendiente hasta que el WebSocket informa que se concretó la sustitución', async () => {
    makeSubstitution.mockResolvedValue(null)

    const result = renderMatch(estado_partido, '77')

    await screen.findByText('Player 4')

    fireEvent.click(screen.getByTestId('substitution-button-1'))
    fireEvent.click(await screen.findByTestId('substitute-option-4'))

    await waitFor(function () {
      expect(
        screen.getByTestId('substitution-button-1')
      ).toHaveTextContent('Player 4')
    })

    const updatedState = {
      ...estado_partido,
      actual_tic: 500,
      players: estado_partido.players.map(function (player) {
        if (player.player_id === 1) {
          return { ...player, is_on_field: false }
        }

        if (player.player_id === 4) {
          return { ...player, is_on_field: true }
        }

        return player
      })
    }

    result.rerender(
      <MemoryRouter>
        <Match
          estado_partido={updatedState}
          matchId="77"
          matchInfo={defaultMatchInfo}
        />
      </MemoryRouter>
    )

    await waitFor(function () {
      expect(
        screen.queryByTestId('substitution-button-1')
      ).not.toBeInTheDocument()
    })

    expect(
      screen.getByTestId('substitution-button-4')
    ).toHaveTextContent('Cambiar jugador')
  })

  it('no cambia el texto del botón cuando falla la solicitud de sustitución', async () => {
    makeSubstitution.mockRejectedValue(
      new Error('Substitution limit reached')
    )

    renderMatch(estado_partido, '77')

    await screen.findByText('Player 4')

    fireEvent.click(screen.getByTestId('substitution-button-1'))
    fireEvent.click(await screen.findByTestId('substitute-option-4'))

    await waitFor(function () {
      expect(makeSubstitution).toHaveBeenCalledTimes(1)
    })

    expect(
      screen.getByTestId('substitution-button-1')
    ).toHaveTextContent('Cambiar jugador')

    expect(
      screen.getByTestId('substitution-button-1')
    ).not.toHaveTextContent('Player 4')
  })

  // Tests de pausas

  it('no muestra ningún cartel cuando no hay una pausa activa', () => {
    renderMatch(estado_partido)

    expect(screen.queryByText('COOLING BREAK')).not.toBeInTheDocument()
    expect(screen.queryByText('ENTRETIEMPO')).not.toBeInTheDocument()
    expect(document.querySelector('video')).not.toBeInTheDocument()
  })

  it('muestra el cartel COOLING BREAK durante la pausa de hidratación', () => {
    renderMatch(estado_partido, '42', {
      pause_type: 'hydration',
      duration: 10,
      planning_duration: 5,
    })

    expect(screen.getByText('COOLING BREAK')).toBeInTheDocument()
    expect(screen.queryByText('ENTRETIEMPO')).not.toBeInTheDocument()
    expect(document.querySelector('video')).not.toBeInTheDocument()
  })

  it('muestra ENTRETIEMPO y reproduce el video durante el entretiempo', () => {
    renderMatch(estado_partido, '42', {
      pause_type: 'halftime',
      duration: 20,
      planning_duration: 15,
    })

    expect(screen.getByText('ENTRETIEMPO')).toBeInTheDocument()

    const video = document.querySelector('video')

    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute(
      'src',
      '/assets/propaganda_san_marino.mp4'
    )
    expect(video).toHaveAttribute('autoplay')
    expect(video.muted).toBe(true)
  })

  it('oculta el video después de 5 segundos pero mantiene ENTRETIEMPO', () => {
    vi.useFakeTimers()

    try {
      renderMatch(estado_partido, '42', {
        pause_type: 'halftime',
        duration: 20,
        planning_duration: 15,
      })

      expect(document.querySelector('video')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(document.querySelector('video')).not.toBeInTheDocument()
      expect(screen.getByText('ENTRETIEMPO')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('no muestra carteles para un tipo de pausa desconocido', () => {
    renderMatch(estado_partido, '42', {
      pause_type: 'unknown',
      duration: 10,
      planning_duration: 5,
    })

    expect(screen.queryByText('COOLING BREAK')).not.toBeInTheDocument()
    expect(screen.queryByText('ENTRETIEMPO')).not.toBeInTheDocument()
    expect(document.querySelector('video')).not.toBeInTheDocument()
  })

  it('mantiene disponible el botón para salir durante una pausa', () => {
    renderMatch(estado_partido, '42', {
      pause_type: 'hydration',
      duration: 10,
      planning_duration: 5,
    })

    expect(
      screen.getByRole('button', { name: 'Salir del partido' })
    ).toBeInTheDocument()
  })

  // Tests de visualización de DT y ventana de sustituciones

  it('muestra el nombre del DT en las insignias de cada equipo', () => {
    renderMatch(estado_partido)

    expect(screen.getByTestId('coach-badge-A')).toHaveTextContent('DT: Coach A')
    expect(screen.getByTestId('coach-badge-B')).toHaveTextContent('DT: Coach B')
  })

  it('muestra Sin DT cuando el club no tiene DT asignado', () => {
    const matchInfoWithoutCoach = {
      ...defaultMatchInfo,
      team_a: { club_id: 1, club_name: 'Club A', coach_behavior_name: null },
      team_b: { club_id: 2, club_name: 'Club B', coach_behavior_name: undefined },
    }

    renderMatch(estado_partido, '42', null, matchInfoWithoutCoach)

    expect(screen.getByTestId('coach-badge-A')).toHaveTextContent('DT: Sin DT')
    expect(screen.getByTestId('coach-badge-B')).toHaveTextContent('DT: Sin DT')
  })

  it('deshabilita el botón de cambios cuando ventanaSustitucionesAbierta es false', () => {
    render(
      <MemoryRouter>
        <Match
          estado_partido={estado_partido}
          matchId="77"
          matchInfo={defaultMatchInfo}
          ventanaSustitucionesAbierta={false}
        />
      </MemoryRouter>
    )

    const subButton = screen.getByTestId('substitution-button-1')
    expect(subButton).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(subButton)
    expect(screen.queryByTestId('substitute-option-4')).not.toBeInTheDocument()
  })

  it('muestra el cartel temporal coach-changes-message cuando llega coachChanges del club propio y lo oculta a los 4 segundos', () => {
    vi.useFakeTimers()

    try {
      render(
        <MemoryRouter>
          <Match
            estado_partido={estado_partido}
            matchId="42"
            matchInfo={defaultMatchInfo}
            coachChanges={{
              event: 'coach_changes',
              from_tic: 10,
              changes: [
                { club_id: 1, player_id: 1, behavior: 'Defender' },
                { club_id: 1, player_id: 2, behavior: 'Defender' },
              ],
            }}
          />
        </MemoryRouter>
      )

      const banner = screen.getByTestId('coach-changes-message')
      expect(banner).toHaveTextContent(
        'DT asignó: Player 1 → Defender, Player 2 → Defender'
      )

      act(() => {
        vi.advanceTimersByTime(4000)
      })

      expect(screen.queryByTestId('coach-changes-message')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('sincroniza el comportamiento cuando el DT cambia un jugador que antes tenía un cambio manual', async () => {
    getBehaviors.mockResolvedValue([
      { behavior_id: 1, name: 'Default', is_default: true },
      { behavior_id: 5, name: 'Ataque Total', is_default: false },
    ])
    changeBehavior.mockResolvedValue(null)

    const result = renderMatch(estado_partido, '77')

    await screen.findByText('Player 1')

    fireEvent.click(screen.getByTestId('starter-card-1'))
    fireEvent.click(await screen.findByRole('option', { name: /Ataque Total/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(screen.getByTestId('starter-behavior-1')).toHaveTextContent('Ataque Total')
    })

    // Luego el DT cambia el comportamiento del jugador 1 a Defender
    const stateAfterCoach = {
      ...estado_partido,
      players: estado_partido.players.map((p) =>
        p.player_id === 1 ? { ...p, current_behavior_name: 'Defender' } : p
      ),
    }

    result.rerender(
      <MemoryRouter>
        <Match
          estado_partido={stateAfterCoach}
          matchId="77"
          matchInfo={defaultMatchInfo}
          coachChanges={{
            event: 'coach_changes',
            from_tic: 460,
            changes: [{ club_id: 1, player_id: 1, behavior: 'Defender' }],
          }}
        />
      </MemoryRouter>
    )

    expect(screen.getByTestId('starter-behavior-1')).toHaveTextContent('Defender')
  })

})