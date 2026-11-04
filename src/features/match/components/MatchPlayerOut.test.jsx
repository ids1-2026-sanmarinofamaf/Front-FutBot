import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MatchPlayerOut } from './MatchPlayerOut'
import { getPlayerById } from '../../player/api.js'
import { makeSubstitution } from '../api.js'

vi.mock('../../player/api.js', () => ({
  getPlayerById: vi.fn()
}))

vi.mock('../api.js', () => ({
  makeSubstitution: vi.fn()
}))

describe('MatchPlayerOut', () => {
  const players = [
    { player_id: 1, team: 'A', is_on_field: true },
    { player_id: 2, team: 'A', is_on_field: true },
    { player_id: 3, team: 'A', is_on_field: true },
    { player_id: 4, team: 'A', is_on_field: false },
    { player_id: 5, team: 'A', is_on_field: false },
    { player_id: 6, team: 'A', is_on_field: false },
    { player_id: 7, team: 'B', is_on_field: true },
    { player_id: 8, team: 'B', is_on_field: true },
    { player_id: 9, team: 'B', is_on_field: true },
    { player_id: 10, team: 'B', is_on_field: false },
    { player_id: 11, team: 'B', is_on_field: false },
    { player_id: 12, team: 'B', is_on_field: false }
  ]

  const playerNumbers = { 1: 1, 2: 2, 3: 3, 7: 1, 8: 2, 9: 3 }

  beforeEach(() => {
    vi.clearAllMocks()

    makeSubstitution.mockResolvedValue(null)

    getPlayerById.mockImplementation(function (id) {
      const player = players.find(function (p) {
        return p.player_id === id
      })

      if (player.team === 'B') {
        return Promise.reject(new Error('Not found'))
      }

      return Promise.resolve({ player_id: id, name: 'Player ' + id })
    })
  })

  function findRectAtXY(rects, x, y) {
    return Array.from(rects).find(function (r) {
      return r.getAttribute('x') === String(x) &&
        r.getAttribute('y') === String(y)
    })
  }

  it('muestra 3 titulares y 3 suplentes por equipo', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(12)

    const starterTeamA = Array.from(rects).filter(
      r => r.getAttribute('x') === '40'
    )
    const starterTeamB = Array.from(rects).filter(
      r => r.getAttribute('x') === '1790'
    )
    const benchTeamA = Array.from(rects).filter(
      r => r.getAttribute('y') === '40' &&
        Number(r.getAttribute('x')) < 1000
    )
    const benchTeamB = Array.from(rects).filter(
      r => r.getAttribute('y') === '40' &&
        Number(r.getAttribute('x')) >= 1000
    )

    expect(starterTeamA).toHaveLength(3)
    expect(starterTeamB).toHaveLength(3)
    expect(benchTeamA).toHaveLength(3)
    expect(benchTeamB).toHaveLength(3)
  })

  it('apila correctamente a los titulares de cada equipo', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    const rects = container.querySelectorAll('rect')

    expect(findRectAtXY(rects, 40, 150)).toBeTruthy()
    expect(findRectAtXY(rects, 40, 250)).toBeTruthy()
    expect(findRectAtXY(rects, 40, 350)).toBeTruthy()
    expect(findRectAtXY(rects, 1790, 150)).toBeTruthy()
    expect(findRectAtXY(rects, 1790, 250)).toBeTruthy()
    expect(findRectAtXY(rects, 1790, 350)).toBeTruthy()
  })

  it('ubica correctamente a los suplentes de cada equipo', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    const rects = container.querySelectorAll('rect')

    expect(findRectAtXY(rects, 320, 40)).toBeTruthy()
    expect(findRectAtXY(rects, 400, 40)).toBeTruthy()
    expect(findRectAtXY(rects, 480, 40)).toBeTruthy()
    expect(findRectAtXY(rects, 1550, 40)).toBeTruthy()
    expect(findRectAtXY(rects, 1470, 40)).toBeTruthy()
    expect(findRectAtXY(rects, 1390, 40)).toBeTruthy()
  })

  it('usa azul para el equipo A y rojo para el equipo B', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    const rects = container.querySelectorAll('rect')
    const blueRects = Array.from(rects).filter(
      r => r.getAttribute('fill') === 'blue'
    )
    const redRects = Array.from(rects).filter(
      r => r.getAttribute('fill') === 'red'
    )

    expect(blueRects).toHaveLength(6)
    expect(redRects).toHaveLength(6)
  })

  it('no define opacidad explícita en los titulares, y usa 0.5 en los suplentes', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    const rects = container.querySelectorAll('rect')
    const starterRects = Array.from(rects).filter(
      r => r.getAttribute('opacity') === null
    )
    const benchRects = Array.from(rects).filter(
      r => r.getAttribute('opacity') === '0.5'
    )

    expect(starterRects).toHaveLength(6)
    expect(benchRects).toHaveLength(6)
  })

  it('consulta los datos de los jugadores por su ID para determinar cuáles pertenecen al club', async () => {
    render(
      <svg>
        <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    await waitFor(() => {
      expect(getPlayerById).toHaveBeenCalledTimes(players.length)

      players.forEach(function (player) {
        expect(getPlayerById).toHaveBeenCalledWith(player.player_id)
      })
    })
  })

  it('muestra los nombres propios y "Rival" para el equipo contrario', async () => {
    render(
      <svg>
        <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('Player 6')).toBeInTheDocument()
      expect(screen.getAllByText('Rival')).toHaveLength(6)
    })
  })

  it('muestra el número solamente en los titulares', async () => {
    render(
      <svg>
        <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Number: 1')).toHaveLength(2)
      expect(screen.getAllByText('Number: 2')).toHaveLength(2)
      expect(screen.getAllByText('Number: 3')).toHaveLength(2)
    })

    expect(screen.queryByText('Number: 4')).not.toBeInTheDocument()
  })

  it('no rompe mientras los datos del jugador todavía no llegaron', () => {
    getPlayerById.mockImplementation(() => new Promise(() => {}))

    expect(() => {
      render(
        <svg>
          <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
        </svg>
      )
    }).not.toThrow()
  })

  it('no vuelve a pedir un jugador que ya fue cargado, ante un rerender', async () => {
    const { rerender } = render(
      <svg>
        <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    await waitFor(() => {
      expect(getPlayerById).toHaveBeenCalledTimes(12)
    })

    rerender(
      <svg>
        <MatchPlayerOut players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(getPlayerById).toHaveBeenCalledTimes(12)
  })

  it('permite seleccionar un titular propio al hacer click y bloquea los titulares rivales', async () => {
    const onSelectStarter = vi.fn()

    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          onSelectStarter={onSelectStarter}
        />
      </svg>
    )

    await screen.findByText('Player 1')

    fireEvent.click(screen.getByTestId('starter-card-7'))
    expect(onSelectStarter).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('starter-card-1'))

    expect(onSelectStarter).toHaveBeenCalledTimes(1)
    expect(onSelectStarter).toHaveBeenCalledWith({
      player_id: 1,
      name: 'Player 1',
      number: 1,
      team: 'A'
    })
  })

  it('soporta que el usuario pertenezca al equipo B y bloquea a un espectador', async () => {
    const onSelectStarter = vi.fn()

    getPlayerById.mockImplementation(function (id) {
      const player = players.find(function (p) {
        return p.player_id === id
      })

      if (player.team === 'B') {
        return Promise.resolve({ player_id: id, name: 'PlayerB ' + id })
      }

      return Promise.reject(new Error('Not found'))
    })

    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          onSelectStarter={onSelectStarter}
        />
      </svg>
    )

    await screen.findByText('PlayerB 7')

    fireEvent.click(screen.getByTestId('starter-card-1'))
    expect(onSelectStarter).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('starter-card-7'))

    expect(onSelectStarter).toHaveBeenCalledWith({
      player_id: 7,
      name: 'PlayerB 7',
      number: 1,
      team: 'B'
    })
  })

  it('muestra el nombre del suplente en el botón del titular cuando la API acepta la sustitución', async () => {
    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchId="77"
        />
      </svg>
    )

    await screen.findByText('Player 1')

    fireEvent.click(screen.getByTestId('substitution-button-1'))
    fireEvent.click(await screen.findByTestId('substitute-option-4'))

    await waitFor(() => {
      expect(makeSubstitution).toHaveBeenCalledWith('77', 1, 4)
      expect(screen.getByTestId('substitution-button-1')).toHaveTextContent(
        'Player 4'
      )
    })

    expect(screen.queryByTestId('substitution-message')).not.toBeInTheDocument()
  })

  it('muestra el mensaje cuando el WebSocket confirma que se realizó la sustitución', async () => {
    const { rerender } = render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchId="77"
        />
      </svg>
    )

    await screen.findByText('Player 1')

    fireEvent.click(screen.getByTestId('substitution-button-1'))
    fireEvent.click(await screen.findByTestId('substitute-option-4'))

    await waitFor(() => {
      expect(screen.getByTestId('substitution-button-1')).toHaveTextContent(
        'Player 4'
      )
    })

    // Simula la actualización del WebSocket durante la pausa:
    // el titular 1 sale y el suplente 4 ingresa.
    const updatedPlayers = players.map(function (player) {
      if (player.player_id === 1) {
        return { ...player, is_on_field: false }
      }

      if (player.player_id === 4) {
        return { ...player, is_on_field: true }
      }

      return player
    })

    rerender(
      <svg>
        <MatchPlayerOut
          players={updatedPlayers}
          playerNumbers={{ ...playerNumbers, 4: 1 }}
          matchId="77"
        />
      </svg>
    )

    await waitFor(() => {
      expect(screen.getByTestId('substitution-message')).toHaveTextContent(
        'Sustitución realizada: Player 1 salió y Player 4 ingresó.'
      )
    })

    expect(
      screen.queryByTestId('substitution-button-1')
    ).not.toBeInTheDocument()

    expect(
      screen.getByTestId('substitution-button-4')
    ).toHaveTextContent('Cambiar jugador')
  })

  it('oculta automáticamente el mensaje de sustitución luego de unos segundos', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    try {
      const { rerender } = render(
        <svg>
          <MatchPlayerOut
            players={players}
            playerNumbers={playerNumbers}
            matchId="77"
          />
        </svg>
      )

      await screen.findByText('Player 1')

      fireEvent.click(screen.getByTestId('substitution-button-1'))
      fireEvent.click(await screen.findByTestId('substitute-option-4'))

      await waitFor(() => {
        expect(screen.getByTestId('substitution-button-1')).toHaveTextContent(
          'Player 4'
        )
      })

      const updatedPlayers = players.map(function (player) {
        if (player.player_id === 1) {
          return { ...player, is_on_field: false }
        }

        if (player.player_id === 4) {
          return { ...player, is_on_field: true }
        }

        return player
      })

      rerender(
        <svg>
          <MatchPlayerOut
            players={updatedPlayers}
            playerNumbers={{ ...playerNumbers, 4: 1 }}
            matchId="77"
          />
        </svg>
      )

      await waitFor(() => {
        expect(screen.getByTestId('substitution-message')).toBeInTheDocument()
      })

      act(() => {
        vi.advanceTimersByTime(4000)
      })

      expect(screen.queryByTestId('substitution-message')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('no muestra el mensaje ni cambia el botón si la API rechaza la sustitución', async () => {
    makeSubstitution.mockRejectedValueOnce(
      new Error('Substitution limit reached')
    )

    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchId="77"
        />
      </svg>
    )

    await screen.findByText('Player 1')

    fireEvent.click(screen.getByTestId('substitution-button-1'))
    fireEvent.click(await screen.findByTestId('substitute-option-4'))

    expect(
      await screen.findByText('Substitution limit reached')
    ).toBeInTheDocument()

    expect(screen.getByTestId('substitution-button-1')).toHaveTextContent(
      'Cambiar jugador'
    )

    expect(screen.queryByTestId('substitution-message')).not.toBeInTheDocument()
  })
})