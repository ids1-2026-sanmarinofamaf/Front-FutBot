import { render } from '@testing-library/react'
import { MatchPlayerOut } from './MatchPlayerOut'

describe('MatchPlayerOut', () => {

  const players = [
    {
      player_id: 1,
      team: 1,
      OnField: true,
      Name: 'Player 1'
    },
    {
      player_id: 2,
      team: 1,
      OnField: false,
      Name: 'Player 2'
    },
    {
      player_id: 3,
      team: 2,
      OnField: true,
      Name: 'Player 3'
    },
    {
      player_id: 4,
      team: 2,
      OnField: false,
      Name: 'Player 4'
    }
  ]

  it('separa correctamente titulares y suplentes por equipo', () => {
    const { container } = render(
        <svg>
        <MatchPlayerOut players={players} />
        </svg>
    )

    const rects = container.querySelectorAll('rect')

    expect(rects).toHaveLength(4)

    // Titular equipo 1
    expect(rects[0]).toHaveAttribute('fill', 'blue')
    expect(rects[0]).toHaveAttribute('opacity', '1')

    // Titular equipo 2
    expect(rects[1]).toHaveAttribute('fill', 'red')
    expect(rects[1]).toHaveAttribute('opacity', '1')

    // Suplente equipo 1
    expect(rects[2]).toHaveAttribute('fill', 'blue')
    expect(rects[2]).toHaveAttribute('opacity', '0.5')

    // Suplente equipo 2
    expect(rects[3]).toHaveAttribute('fill', 'red')
    expect(rects[3]).toHaveAttribute('opacity', '0.5')
    })

  it('posiciona correctamente titulares y suplentes', () => {
    const { container } = render(
        <svg>
        <MatchPlayerOut players={players} />
        </svg>
    )

    const rects = container.querySelectorAll('rect')

    // Titular equipo 1
    expect(rects[0]).toHaveAttribute('x', '40')
    expect(rects[0]).toHaveAttribute('y', '150')

    // Titular equipo 2
    expect(rects[1]).toHaveAttribute('x', '1790')
    expect(rects[1]).toHaveAttribute('y', '150')

    // Suplente equipo 1
    expect(rects[2]).toHaveAttribute('x', '320')
    expect(rects[2]).toHaveAttribute('y', '40')

    // Suplente equipo 2
    expect(rects[3]).toHaveAttribute('x', '1550')
    expect(rects[3]).toHaveAttribute('y', '40')
    })

  it('muestra correctamente los nombres de los jugadores', () => {
    const { getByText } = render(
      <svg>
        <MatchPlayerOut players={players} />
      </svg>
    )

    expect(getByText('Player 1')).toBeInTheDocument()
    expect(getByText('Player 2')).toBeInTheDocument()
    expect(getByText('Player 3')).toBeInTheDocument()
    expect(getByText('Player 4')).toBeInTheDocument()
  })
})