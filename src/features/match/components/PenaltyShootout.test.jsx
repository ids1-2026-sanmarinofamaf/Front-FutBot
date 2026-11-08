import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
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
})