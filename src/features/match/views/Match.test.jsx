
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Match } from './Match'
import { getPlayerById } from '../../player/api.js'
import { getBehaviors } from '../../behaviors/api.js'
import { changeBehavior } from '../api.js'

vi.mock('../../player/api.js', () => ({
  getPlayerById: vi.fn()
}))

vi.mock('../../behaviors/api.js', () => ({
  getBehaviors: vi.fn()
}))

vi.mock('../api.js', () => ({
  changeBehavior: vi.fn()
}))

function renderMatch(estado_partido, matchId = '42', pausa = null) {
  return render(
    <MemoryRouter>
      <Match
        estado_partido={estado_partido}
        matchId={matchId}
        pausa={pausa}
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

    // El backend solo devuelve jugadores del propio club.
    // Los del equipo rival (team "B") responden 404 → se muestran como "Rival".
    getPlayerById.mockImplementation(function (id) {
      const player = estado_partido.players.find(function (p) {
        return p.player_id === id
      })

      if (player.team === 'B') {
        return Promise.reject(new Error('Not found'))
      }

      return Promise.resolve({
        player_id: id,
        name: 'Player ' + id
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

  it('muestra los nombres del equipo propio y "Rival" para el equipo contrario', async () => {
    renderMatch(estado_partido)

    expect(await screen.findByText('Player 1')).toBeInTheDocument()
    expect(await screen.findByText('Player 2')).toBeInTheDocument()
    expect(await screen.findByText('Player 3')).toBeInTheDocument()
    expect(await screen.findByText('Player 4')).toBeInTheDocument()
    expect(await screen.findByText('Player 5')).toBeInTheDocument()
    expect(await screen.findByText('Player 6')).toBeInTheDocument()

    expect(await screen.findAllByText('Rival')).toHaveLength(6)

    expect(getPlayerById).toHaveBeenCalledTimes(estado_partido.players.length)

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

    expect(await screen.findByText('Default')).toBeInTheDocument()
    expect(screen.getByText('Ataque Total')).toBeInTheDocument()
    expect(getBehaviors).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('option', { name: /Ataque Total/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(function () {
      expect(changeBehavior).toHaveBeenCalledTimes(1)
      expect(changeBehavior).toHaveBeenCalledWith('77', 1, 5)
    })

    await waitFor(function () {
      expect(
        screen.queryByRole('heading', { name: 'Cambiar comportamiento' })
      ).not.toBeInTheDocument()
    })

    // Al volver a abrir otro titular, reutiliza la lista cacheada sin volver a llamar a getBehaviors
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
    getPlayerById.mockRejectedValue(new Error('Not found'))

    renderMatch(estado_partido, '77')

    await waitFor(function () {
      expect(screen.getAllByText('Rival')).toHaveLength(12)
    })

    fireEvent.click(screen.getByTestId('starter-card-1'))
    fireEvent.click(screen.getByTestId('starter-card-7'))

    expect(
      screen.queryByRole('heading', { name: 'Cambiar comportamiento' })
    ).not.toBeInTheDocument()
    expect(getBehaviors).not.toHaveBeenCalled()
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

})
