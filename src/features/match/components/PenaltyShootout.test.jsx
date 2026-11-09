import { render, screen, act, fireEvent, } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, } from 'vitest'
import { PenaltyShootout } from './PenaltyShootout'
import { submitPenaltyChoice } from '../api.js'

vi.mock('../api.js', () => ({
  submitPenaltyChoice: vi.fn(),
}))

describe('PenaltyShootout', () => {
  const matchInfo = {
    match_id: 42,
    my_club_id: 1,
    team_a: { club_id: 1, club_name: 'Club A' },
    team_b: { club_id: 2, club_name: 'Club B' },
    players: [
      { player_id: 1, name: 'Player 1' },
      { player_id: 7, name: 'Player 7' },
    ],
  }

  const choosingPenalties = {
    phase: 'choosing',
    data: {
      turn: 1,
      club_id: 1,
      kicker: 1,
      remaining_seconds: 5,
    },
    results: [],
  }

  beforeEach(() => {
    submitPenaltyChoice.mockReset()
    submitPenaltyChoice.mockResolvedValue(null)
  })

  it('muestra los nombres reales y seis casilleros pendientes al comenzar', () => {
    const { container } = render(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={{
          phase: 'intro',
          data: { duration: 5 },
          results: [],
        }}
      />
    )

    expect(
      screen.getByRole('rowheader', { name: 'Club A' })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('rowheader', { name: 'Club B' })
    ).toBeInTheDocument()

    expect(
      screen.getAllByRole('cell', { name: /pendiente$/ })
    ).toHaveLength(6)

    expect(
      container.querySelectorAll('[aria-current="step"]')
    ).toHaveLength(0)
  })

  it('ubica goles y atajadas según el club y el turno aunque lleguen desordenados', () => {
    const results = [
      { turn: 5, club_id: 1, is_goal: true },
      { turn: 2, club_id: 2, is_goal: false },
    ]

    render(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={{
          phase: 'result',
          data: results[0],
          results,
        }}
      />
    )

    expect(
      screen.getByRole('cell', { name: 'Club A, penal 3: gol' })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('cell', { name: 'Club B, penal 1: atajado' })
    ).toBeInTheDocument()

    expect(
      screen.getAllByRole('cell', { name: /pendiente$/ })
    ).toHaveLength(4)
  })

  it('identifica al pateador y al casillero activo y deja de resaltarlo al finalizar', () => {
    const { container, rerender } = render(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={{
          phase: 'choosing',
          data: {
            turn: 4,
            club_id: 2,
            kicker: 7,
            remaining_seconds: 5,
          },
          results: [],
        }}
      />
    )

    expect(screen.getByText('Player 7')).toBeInTheDocument()

    expect(
      screen.getByRole('cell', {
        name: 'Club B, penal 2: pendiente',
      })
    ).toHaveAttribute('aria-current', 'step')

    expect(
      container.querySelectorAll('[aria-current="step"]')
    ).toHaveLength(1)

    rerender(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={{
          phase: 'finished',
          data: {
            winner_club_id: 2,
            score_club_a: 1,
            score_club_b: 2,
          },
          results: [],
        }}
      />
    )

    expect(
      container.querySelectorAll('[aria-current="step"]')
    ).toHaveLength(0)
  })

  it('descuenta el tiempo y muestra rojo en 02, 01 y 00', () => {
    vi.useFakeTimers()

    try {
      const { unmount } = render(
        <PenaltyShootout
          matchInfo={matchInfo}
          penalties={{
            phase: 'choosing',
            data: {
              turn: 1,
              club_id: 1,
              kicker: 1,
              remaining_seconds: 5,
            },
            results: [],
          }}
        />
      )

      const clock = screen.getByRole('img', {
        name: /^Tiempo para elegir:/,
      })

      expect(clock).toHaveTextContent('05')
      expect(clock).toHaveAttribute('fill', '#F2F2F2')

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(clock).toHaveTextContent('03')
      expect(clock).toHaveAttribute('fill', '#F2F2F2')

      for (const expected of ['02', '01', '00']) {
        act(() => {
          vi.advanceTimersByTime(1000)
        })

        expect(clock).toHaveTextContent(expected)
        expect(clock).toHaveAttribute('fill', '#F87171')
      }

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(clock).toHaveTextContent('00')

      unmount()

      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('respeta el tiempo restante recibido y no reinicia el reloj al renderizar el mismo turno', () => {
    vi.useFakeTimers()

    try {
      const { rerender, unmount } = render(
        <PenaltyShootout
          matchInfo={matchInfo}
          penalties={{
            phase: 'choosing',
            data: {
              turn: 1,
              club_id: 1,
              kicker: 1,
              remaining_seconds: 1.5,
            },
            results: [],
          }}
        />
      )

      const clock = screen.getByRole('img', {
        name: /^Tiempo para elegir:/,
      })

      expect(clock).toHaveTextContent('02')

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(clock).toHaveTextContent('01')

      rerender(
        <PenaltyShootout
          matchInfo={matchInfo}
          penalties={{
            phase: 'choosing',
            data: {
              turn: 1,
              club_id: 1,
              kicker: 1,
              remaining_seconds: 1.5,
            },
            results: [],
          }}
        />
      )

      expect(clock).toHaveTextContent('01')

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(clock).toHaveTextContent('00')

      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('reinicia el reloj para un nuevo turno y elimina el intervalo al finalizar', () => {
    vi.useFakeTimers()

    try {
      const { rerender } = render(
        <PenaltyShootout
          matchInfo={matchInfo}
          penalties={{
            phase: 'choosing',
            data: {
              turn: 1,
              club_id: 1,
              kicker: 1,
              remaining_seconds: 5,
            },
            results: [],
          }}
        />
      )

      const clock = screen.getByRole('img', {
        name: /^Tiempo para elegir:/,
      })

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(clock).toHaveTextContent('02')

      rerender(
        <PenaltyShootout
          matchInfo={matchInfo}
          penalties={{
            phase: 'choosing',
            data: {
              turn: 2,
              club_id: 2,
              kicker: 7,
              remaining_seconds: 5,
            },
            results: [],
          }}
        />
      )

      expect(clock).toHaveTextContent('05')
      expect(clock).toHaveAttribute('fill', '#F2F2F2')
      expect(vi.getTimerCount()).toBe(1)

      rerender(
        <PenaltyShootout
          matchInfo={matchInfo}
          penalties={{
            phase: 'finished',
            data: {
              winner_club_id: 2,
              score_club_a: 1,
              score_club_b: 2,
            },
            results: [],
          }}
        />
      )

      expect(
        screen.queryByRole('img', { name: /^Tiempo para elegir:/ })
      ).not.toBeInTheDocument()

      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it.each([
    [1, 'Elegir izquierda', 'LEFT'],
    [1, 'Elegir centro', 'CENTER'],
    [1, 'Elegir derecha', 'RIGHT'],
    [2, 'Elegir izquierda', 'LEFT'],
    [2, 'Elegir centro', 'CENTER'],
    [2, 'Elegir derecha', 'RIGHT'],
  ])(
    'el club %i envía mediante %s el lado %s y queda bloqueado',
    async (clubId, buttonName, side) => {
      render(
        <PenaltyShootout
          matchInfo={{ ...matchInfo, my_club_id: clubId }}
          penalties={choosingPenalties}
        />
      )

      const button = screen.getByRole('button', { name: buttonName })

      expect(button).toBeEnabled()

      fireEvent.click(button)

      expect(
        await screen.findByText('Elección enviada')
      ).toBeInTheDocument()

      expect(submitPenaltyChoice).toHaveBeenCalledTimes(1)
      expect(submitPenaltyChoice).toHaveBeenCalledWith(42, 1, side)

      screen.getAllByRole('button').forEach(function (button) {
        expect(button).toBeDisabled()
      })

      fireEvent.click(screen.getByRole('button', {
        name: 'Elegir centro',
      }))

      expect(submitPenaltyChoice).toHaveBeenCalledTimes(1)
    }
  )

  it.each([null, 999])(
    'bloquea las elecciones cuando el club del usuario es %s',
    (clubId) => {
      render(
        <PenaltyShootout
          matchInfo={{ ...matchInfo, my_club_id: clubId }}
          penalties={choosingPenalties}
        />
      )

      screen.getAllByRole('button').forEach(function (button) {
        expect(button).toBeDisabled()
      })

      fireEvent.click(screen.getByRole('button', {
        name: 'Elegir izquierda',
      }))

      expect(submitPenaltyChoice).not.toHaveBeenCalled()
    }
  )

  it('bloquea las flechas al agotarse el tiempo y fuera de la fase de elección', () => {
    vi.useFakeTimers()

    try {
      const { rerender, unmount } = render(
        <PenaltyShootout
          matchInfo={matchInfo}
          penalties={choosingPenalties}
        />
      )

      expect(
        screen.getByRole('button', { name: 'Elegir izquierda' })
      ).toBeEnabled()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      screen.getAllByRole('button').forEach(function (button) {
        expect(button).toBeDisabled()
      })

      fireEvent.click(screen.getByRole('button', {
        name: 'Elegir izquierda',
      }))

      expect(submitPenaltyChoice).not.toHaveBeenCalled()

      const nextTurn = {
        ...choosingPenalties,
        data: {
          ...choosingPenalties.data,
          turn: 2,
          club_id: 2,
          kicker: 7,
        },
      }

      rerender(
        <PenaltyShootout
          matchInfo={matchInfo}
          penalties={nextTurn}
        />
      )

      expect(
        screen.getByRole('button', { name: 'Elegir izquierda' })
      ).toBeEnabled()

      rerender(
        <PenaltyShootout
          matchInfo={matchInfo}
          penalties={{ ...nextTurn, phase: 'result' }}
        />
      )

      screen.getAllByRole('button').forEach(function (button) {
        expect(button).toBeDisabled()
      })

      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('permite reintentar cuando falla el envío', async () => {
    submitPenaltyChoice.mockRejectedValueOnce(
      new Error('Sin conexión')
    )

    render(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={choosingPenalties}
      />
    )

    fireEvent.click(screen.getByRole('button', {
      name: 'Elegir izquierda',
    }))

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent('No se pudo enviar la elección')

    screen.getAllByRole('button').forEach(function (button) {
      expect(button).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', {
      name: 'Elegir centro',
    }))

    expect(
      await screen.findByText('Elección enviada')
    ).toBeInTheDocument()

    expect(submitPenaltyChoice).toHaveBeenCalledTimes(2)
    expect(submitPenaltyChoice).toHaveBeenNthCalledWith(1, 42, 1, 'LEFT')
    expect(submitPenaltyChoice).toHaveBeenNthCalledWith(2, 42, 1, 'CENTER')
  })

  it('mantiene bloqueado el turno cuando el servidor devuelve HTTP 409', async () => {
    const error = new Error('Turn closed')
    error.status = 409
    submitPenaltyChoice.mockRejectedValueOnce(error)

    render(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={choosingPenalties}
      />
    )

    fireEvent.click(screen.getByRole('button', {
      name: 'Elegir izquierda',
    }))

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent('Este turno ya no admite elecciones.')

    screen.getAllByRole('button').forEach(function (button) {
      expect(button).toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', {
      name: 'Elegir derecha',
    }))

    expect(submitPenaltyChoice).toHaveBeenCalledTimes(1)
  })

  it('bloquea mientras envía y conserva la elección del nuevo turno ante una respuesta anterior', async () => {
    let resolveFirst
    let resolveSecond

    const firstRequest = new Promise(function (resolve) {
      resolveFirst = resolve
    })

    const secondRequest = new Promise(function (resolve) {
      resolveSecond = resolve
    })

    submitPenaltyChoice
      .mockReturnValueOnce(firstRequest)
      .mockReturnValueOnce(secondRequest)

    const { rerender } = render(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={choosingPenalties}
      />
    )

    fireEvent.click(screen.getByRole('button', {
      name: 'Elegir izquierda',
    }))

    expect(
      screen.getByRole('status')
    ).toHaveTextContent('Enviando elección...')

    screen.getAllByRole('button').forEach(function (button) {
      expect(button).toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', {
      name: 'Elegir centro',
    }))

    expect(submitPenaltyChoice).toHaveBeenCalledTimes(1)

    rerender(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={{
          ...choosingPenalties,
          data: {
            ...choosingPenalties.data,
            turn: 2,
            club_id: 2,
            kicker: 7,
          },
        }}
      />
    )

    const rightButton = screen.getByRole('button', {
      name: 'Elegir derecha',
    })

    expect(rightButton).toBeEnabled()

    fireEvent.click(rightButton)

    expect(submitPenaltyChoice).toHaveBeenCalledTimes(2)
    expect(submitPenaltyChoice).toHaveBeenNthCalledWith(2, 42, 2, 'RIGHT')

    await act(async () => {
      resolveFirst(null)
      await firstRequest
    })

    expect(
      screen.getByRole('status')
    ).toHaveTextContent('Enviando elección...')

    screen.getAllByRole('button').forEach(function (button) {
      expect(button).toBeDisabled()
    })

    await act(async () => {
      resolveSecond(null)
      await secondRequest
    })

    expect(
      screen.getByRole('status')
    ).toHaveTextContent('Elección enviada')
  })

  it.each([
    ['Club A', 1, 3, 1],
    ['Club B', 2, 1, 3],
  ])('muestra a %s como ganador y el marcador final', (
    winnerName,
    winnerClubId,
    scoreClubA,
    scoreClubB,
  ) => {
    render(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={{
          phase: 'finished',
          data: {
            winner_club_id: winnerClubId,
            score_club_a: scoreClubA,
            score_club_b: scoreClubB,
          },
          results: [],
        }}
      />
    )

    const panel = screen.getByRole('status', {
      name: 'Resultado de la tanda de penales',
    })

    expect(panel).toHaveTextContent('¡PARTIDO FINALIZADO!')
    expect(panel).toHaveTextContent(`Ganador: ${winnerName}`)
    expect(panel).toHaveTextContent(
      `Penales: ${scoreClubA} - ${scoreClubB}`
    )

    expect(
      screen.queryByText('VICTORIA POR SORTEO')
    ).not.toBeInTheDocument()

    expect(
      screen.queryByRole('img', {
        name: /^Tiempo para elegir:/,
      })
    ).not.toBeInTheDocument()

    screen.getAllByRole('button').forEach(function (button) {
      expect(button).toBeDisabled()
    })

    expect(submitPenaltyChoice).not.toHaveBeenCalled()
  })

  it('espera el evento final y muestra al ganador del sorteo enviado por el servidor', () => {
    const { rerender } = render(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={{
          phase: 'result',
          data: {
            turn: 6,
            club_id: 2,
            kicker: 7,
            kick_side: 'LEFT',
            save_side: 'RIGHT',
            is_goal: true,
            score_club_a: 2,
            score_club_b: 2,
            duration: 5,
          },
          results: [],
        }}
      />
    )

    expect(
      screen.queryByRole('status', {
        name: 'Resultado de la tanda de penales',
      })
    ).not.toBeInTheDocument()

    rerender(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={{
          phase: 'finished',
          data: {
            winner_club_id: 2,
            score_club_a: 2,
            score_club_b: 2,
          },
          results: [],
        }}
      />
    )

    expect(
      screen.getByText('DEFINIENDO POR SORTEO...')
    ).toBeInTheDocument()

    expect(
      screen.queryByText('Ganador: Club B')
    ).not.toBeInTheDocument()

    fireEvent.animationEnd(
      screen.getByRole('img', { name: 'Moneda del sorteo' })
    )

    const panel = screen.getByRole('status', {
      name: 'Resultado de la tanda de penales',
    })

    expect(panel).toHaveTextContent('Ganador: Club B')
    expect(panel).toHaveTextContent('Penales: 2 - 2')
    expect(panel).toHaveTextContent('VICTORIA POR SORTEO')
  })

  it('muestra los penales anteriores y mantiene los controles bloqueados mientras espera', () => {
    render(
      <PenaltyShootout
        matchInfo={matchInfo}
        penalties={{
          phase: 'waiting',
          data: null,
          results: [
            { turn: 1, club_id: 1, is_goal: true },
            { turn: 2, club_id: 2, is_goal: false },
          ],
        }}
      />
    )

    expect(
      screen.getByRole('cell', { name: 'Club A, penal 1: gol' })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('cell', { name: 'Club B, penal 1: atajado' })
    ).toBeInTheDocument()

    expect(
      screen.getAllByRole('cell', { name: /pendiente$/ })
    ).toHaveLength(4)

    expect(
      screen.queryByRole('img', { name: /^Tiempo para elegir:/ })
    ).not.toBeInTheDocument()

    screen.getAllByRole('button').forEach(function (button) {
      expect(button).toBeDisabled()
      fireEvent.click(button)
    })

    expect(submitPenaltyChoice).not.toHaveBeenCalled()
  })
})
