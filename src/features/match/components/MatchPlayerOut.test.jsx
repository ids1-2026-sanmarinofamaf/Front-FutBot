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

  const defaultMatchInfo = {
    match_id: 42,
    my_club_id: 1,
    team_a: { club_id: 1, club_name: 'Club A', coach_behavior_name: 'Coach A' },
    team_b: { club_id: 2, club_name: 'Club B', coach_behavior_name: 'Coach B' },
    players: players.map((p) => ({
      player_id: p.player_id,
      name: p.team === 'A' ? `Player ${p.player_id}` : 'Rival',
      club_id: p.team === 'A' ? 1 : 2,
      shirt_number: playerNumbers[p.player_id] ?? (p.player_id - 3),
      team: p.team,
    })),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    makeSubstitution.mockResolvedValue(null)
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
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    const rects = container.querySelectorAll('rect')
    const playerCardRects = Array.from(rects).filter(
      r => r.getAttribute('width') === '135' || r.getAttribute('width') === '85'
    )
    expect(playerCardRects).toHaveLength(12)

    const starterTeamA = Array.from(rects).filter(
      r => r.getAttribute('x') === '30'
    )
    const starterTeamB = Array.from(rects).filter(
      r => r.getAttribute('x') === '1755'
    )
    const benchTeamA = Array.from(rects).filter(
      r => r.getAttribute('y') === '35' &&
        Number(r.getAttribute('x')) < 1000
    )
    const benchTeamB = Array.from(rects).filter(
      r => r.getAttribute('y') === '35' &&
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
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    const rects = container.querySelectorAll('rect')

    expect(findRectAtXY(rects, 30, 160)).toBeTruthy()
    expect(findRectAtXY(rects, 30, 410)).toBeTruthy()
    expect(findRectAtXY(rects, 30, 660)).toBeTruthy()
    expect(findRectAtXY(rects, 1755, 160)).toBeTruthy()
    expect(findRectAtXY(rects, 1755, 410)).toBeTruthy()
    expect(findRectAtXY(rects, 1755, 660)).toBeTruthy()
  })

  it('ubica correctamente a los suplentes de cada equipo', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    const rects = container.querySelectorAll('rect')

    expect(findRectAtXY(rects, 310, 35)).toBeTruthy()
    expect(findRectAtXY(rects, 405, 35)).toBeTruthy()
    expect(findRectAtXY(rects, 500, 35)).toBeTruthy()
    expect(findRectAtXY(rects, 1525, 35)).toBeTruthy()
    expect(findRectAtXY(rects, 1430, 35)).toBeTruthy()
    expect(findRectAtXY(rects, 1335, 35)).toBeTruthy()
  })

  it('usa celeste para el equipo A y ámbar para el equipo B', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    const rects = container.querySelectorAll('rect')
    const blueRects = Array.from(rects).filter(
      r => r.getAttribute('fill') === '#5BB5D9'
    )
    const redRects = Array.from(rects).filter(
      r => r.getAttribute('fill') === '#D98E32'
    )

    expect(blueRects).toHaveLength(6)
    expect(redRects).toHaveLength(6)
  })

  it('no define opacidad explícita en los titulares, y usa 0.5 en los suplentes', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    const rects = container.querySelectorAll('rect')
    const starterRects = Array.from(rects).filter(
      r => r.getAttribute('opacity') === null && r.getAttribute('width') === '135'
    )
    const benchRects = Array.from(rects).filter(
      r => r.getAttribute('opacity') === '0.85'
    )

    expect(starterRects).toHaveLength(6)
    expect(benchRects).toHaveLength(6)
  })

  it('determina los datos de los jugadores directamente sin llamadas HTTP a getPlayerById', () => {
    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('Player 6')).toBeInTheDocument()
    expect(screen.getAllByText('Rival')).toHaveLength(6)
    expect(getPlayerById).not.toHaveBeenCalled()
  })

  it('muestra los nombres propios y "Rival" para el equipo contrario', () => {
    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('Player 6')).toBeInTheDocument()
    expect(screen.getAllByText('Rival')).toHaveLength(6)
  })

  it('muestra el número solamente en los titulares', () => {
    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    expect(screen.getAllByText('Number: 1')).toHaveLength(2)
    expect(screen.getAllByText('Number: 2')).toHaveLength(2)
    expect(screen.getAllByText('Number: 3')).toHaveLength(2)

    expect(screen.queryByText('Number: 4')).not.toBeInTheDocument()
  })

  it('renderiza correctamente sin errores con matchInfo vacío', () => {
    expect(() => {
      render(
        <svg>
          <MatchPlayerOut
            players={players}
            playerNumbers={playerNumbers}
            matchInfo={{}}
          />
        </svg>
      )
    }).not.toThrow()
  })

  it('no realiza llamadas HTTP a la API ante un rerender', () => {
    const { rerender } = render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    rerender(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    expect(getPlayerById).not.toHaveBeenCalled()
  })

  it('permite seleccionar un titular propio al hacer click y bloquea los titulares rivales', () => {
    const onSelectStarter = vi.fn()

    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
          onSelectStarter={onSelectStarter}
        />
      </svg>
    )

    expect(screen.getByText('Player 1')).toBeInTheDocument()

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

  it('soporta que el usuario pertenezca al equipo B y bloquea a un espectador', () => {
    const onSelectStarter = vi.fn()

    const matchInfoTeamB = {
      my_club_id: 2,
      players: players.map(p => ({
        player_id: p.player_id,
        name: p.team === 'B' ? `PlayerB ${p.player_id}` : 'Rival',
        club_id: p.team === 'A' ? 1 : 2,
        shirt_number: playerNumbers[p.player_id] ?? 1,
        team: p.team,
      })),
    }

    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={matchInfoTeamB}
          onSelectStarter={onSelectStarter}
        />
      </svg>
    )

    expect(screen.getByText('PlayerB 7')).toBeInTheDocument()

    // No permite clickear un rival (equipo A)
    fireEvent.click(screen.getByTestId('starter-card-1'))
    expect(onSelectStarter).not.toHaveBeenCalled()

    // Permite clickear un titular propio (equipo B)
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
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    expect(screen.getByText('Player 1')).toBeInTheDocument()

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
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    expect(screen.getByText('Player 1')).toBeInTheDocument()

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
          matchInfo={defaultMatchInfo}
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
            matchInfo={defaultMatchInfo}
          />
        </svg>
      )

      expect(screen.getByText('Player 1')).toBeInTheDocument()

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
            matchInfo={defaultMatchInfo}
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
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    expect(screen.getByText('Player 1')).toBeInTheDocument()

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

  it('muestra el comportamiento asignado en la tarjeta del titular', () => {
    const playersWithBehavior = players.map(p => ({
      ...p,
      current_behavior_name: p.player_id === 1 ? 'Ataque Rápido' : 'Default'
    }))

    render(
      <svg>
        <MatchPlayerOut
          players={playersWithBehavior}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
        />
      </svg>
    )

    expect(screen.getByTestId('starter-behavior-1')).toHaveTextContent('Ataque Rápido')
    expect(screen.getByTestId('starter-behavior-2')).toHaveTextContent('Default')
    expect(screen.queryByTestId('starter-behavior-7')).not.toBeInTheDocument()
  })

  it('deshabilita el botón de sustitución cuando la ventana de sustituciones está cerrada', () => {
    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchId="77"
          matchInfo={defaultMatchInfo}
          ventanaSustitucionesAbierta={false}
        />
      </svg>
    )

    const button = screen.getByTestId('substitution-button-1')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveStyle({ cursor: 'not-allowed' })

    fireEvent.click(button)

    expect(screen.queryByTestId('substitute-option-4')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cancel-substitution-A')).not.toBeInTheDocument()
  })

  it('mantiene visible el control de comportamiento pero bloquea el click cuando está deshabilitado', () => {
    const onSelectStarter = vi.fn()

    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
          onSelectStarter={onSelectStarter}
          behaviorChangesDisabled={true}
        />
      </svg>
    )

    const card = screen.getByTestId('starter-card-1')

    expect(card).toHaveTextContent('Cambiar comp.')
    expect(card).toHaveAttribute('aria-disabled', 'true')
    expect(card).toHaveStyle({ cursor: 'not-allowed' })

    fireEvent.click(card)

    expect(onSelectStarter).not.toHaveBeenCalled()
  })

  it('oculta una lista de suplentes abierta cuando se cierra la ventana de sustituciones', () => {
    const { rerender } = render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
          ventanaSustitucionesAbierta={true}
        />
      </svg>
    )

    fireEvent.click(screen.getByTestId('substitution-button-1'))

    expect(screen.getByTestId('substitute-option-4')).toBeInTheDocument()

    rerender(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchInfo={defaultMatchInfo}
          ventanaSustitucionesAbierta={false}
        />
      </svg>
    )

    expect(
      screen.queryByTestId('substitute-option-4')
    ).not.toBeInTheDocument()

    expect(
      screen.queryByTestId('cancel-substitution-A')
    ).not.toBeInTheDocument()

    const button = screen.getByTestId('substitution-button-1')
    expect(button).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(button)

    expect(
      screen.queryByTestId('substitute-option-4')
    ).not.toBeInTheDocument()
    expect(makeSubstitution).not.toHaveBeenCalled()
  })

  it('muestra el cartel de sustitución cuando llega coachSubstitutions del propio club e ignora las del rival', () => {
    const { rerender } = render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchId="77"
          matchInfo={defaultMatchInfo}
          coachSubstitutions={{
            event: 'coach_substitutions',
            changes: [{ club_id: 2, player_out_id: 7, player_in_id: 10 }],
          }}
        />
      </svg>
    )

    expect(screen.queryByTestId('substitution-message')).not.toBeInTheDocument()

    rerender(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchId="77"
          matchInfo={defaultMatchInfo}
          coachSubstitutions={{
            event: 'coach_substitutions',
            changes: [{ club_id: 1, player_out_id: 1, player_in_id: 4 }],
          }}
        />
      </svg>
    )

    expect(screen.getByTestId('substitution-message')).toHaveTextContent(
      'Sustitución realizada: Player 1 salió y Player 4 ingresó.'
    )
  })

  it('muestra en el botón del titular el nombre del suplente cuando el servidor informa una sustitución pendiente del DT', () => {
    render(
      <svg>
        <MatchPlayerOut
          players={players}
          playerNumbers={playerNumbers}
          matchId="77"
          matchInfo={defaultMatchInfo}
          serverPendingSubstitution={{ player_out_id: 2, player_in_id: 5 }}
        />
      </svg>
    )

    expect(screen.getByTestId('substitution-button-2')).toHaveTextContent(
      'Player 5'
    )
    expect(screen.getByTestId('substitution-button-1')).toHaveTextContent(
      'Cambiar jugador'
    )
  })
})
