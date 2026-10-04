import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Match } from './Match'
import { getPlayerById } from '../../player/api.js'

vi.mock('../../player/api.js', () => ({
  getPlayerById: vi.fn()
}))

function renderMatch(estado_partido) {
  return render(
    <MemoryRouter>
      <Match estado_partido={estado_partido} />
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

    getPlayerById.mockImplementation(function (id) {
      return Promise.resolve({
        player_id: id,
        Name: 'Player ' + id
      })
    })
  })

  it('dibuja un círculo por cada jugador en cancha de ambos equipos, más la pelota, mas el circulo central de la cancha', () => {
    const { container } = renderMatch(estado_partido)

    expect(container.querySelectorAll('circle')).toHaveLength(8)
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

  it('muestra los nombres de los 12 jugadores mediante la API', async () => {
    renderMatch(estado_partido)

    for (const player of estado_partido.players) {
      expect(
        await screen.findByText('Player ' + player.player_id)
      ).toBeInTheDocument()
    }

    expect(getPlayerById).toHaveBeenCalledTimes(12)

    estado_partido.players.forEach(function (player) {
      expect(getPlayerById).toHaveBeenCalledWith(player.player_id)
    })
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
        <Match estado_partido={updatedState} />
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

    // Tanto el player_id 1 (equipo A) como el 7 (equipo B) deberían tener el número 1,
    // sin importar que el 7 apareció primero en el array
    expect(screen.getAllByText('Number: 1')).toHaveLength(2)
    expect(screen.getAllByText('Number: 2')).toHaveLength(2)
  })

})