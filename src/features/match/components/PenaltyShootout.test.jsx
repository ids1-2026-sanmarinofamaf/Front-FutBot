import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PenaltyShootout } from './PenaltyShootout'

describe('PenaltyShootout', () => {
  const matchInfo = {
    team_a: { club_id: 1, club_name: 'Club A' },
    team_b: { club_id: 2, club_name: 'Club B' },
    players: [
      { player_id: 1, name: 'Player 1' },
      { player_id: 7, name: 'Player 7' },
    ],
  }

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
})
