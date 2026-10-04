import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MatchPlayerInMatch } from './MatchPlayerInMatch'

describe('MatchPlayerInMatch', () => {

  it('muestra solamente los jugadores que están en cancha', () => {
    const players = [
      {
        player_id: 1,
        x: 5,
        y: 10,
        team: 'A',
        is_on_field: true
      },
      {
        player_id: 2,
        x: 10,
        y: 15,
        team: 'A',
        is_on_field: false
      }
    ]

    const playerNumbers = {
      1: 7,
      2: 8
    }

    render(
      <svg>
        <MatchPlayerInMatch
          players={players}
          playerNumbers={playerNumbers}
        />
      </svg>
    )

    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.queryByText('8')).not.toBeInTheDocument()
  })

  it('muestra el número correspondiente a cada jugador', () => {
    const players = [
      {
        player_id: 1,
        x: 5,
        y: 10,
        team: 'A',
        is_on_field: true
      },
      {
        player_id: 2,
        x: 20,
        y: 5,
        team: 'B',
        is_on_field: true
      }
    ]

    const playerNumbers = {
      1: 3,
      2: 11
    }

    render(
      <svg>
        <MatchPlayerInMatch
          players={players}
          playerNumbers={playerNumbers}
        />
      </svg>
    )

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('11')).toBeInTheDocument()
  })

  it('usa azul para el equipo A y rojo para el equipo B', () => {
    const players = [
      {
        player_id: 1,
        x: 5,
        y: 10,
        team: 'A',
        is_on_field: true
      },
      {
        player_id: 2,
        x: 20,
        y: 5,
        team: 'B',
        is_on_field: true
      }
    ]

    const playerNumbers = {
      1: 1,
      2: 2
    }

    const { container } = render(
      <svg>
        <MatchPlayerInMatch
          players={players}
          playerNumbers={playerNumbers}
        />
      </svg>
    )

    const groups = container.querySelectorAll('g')

    expect(groups).toHaveLength(2)

    expect(groups[0].querySelector('circle'))
      .toHaveAttribute('fill', 'blue')

    expect(groups[1].querySelector('circle'))
      .toHaveAttribute('fill', 'red')
  })

  it('calcula la posición del jugador con el offset de media unidad', () => {
    const players = [
      {
        player_id: 1,
        x: 5.8,
        y: 10.3,
        team: 'A',
        is_on_field: true
      }
    ]

    const playerNumbers = {
      1: 7
    }

    const { container } = render(
      <svg>
        <MatchPlayerInMatch
          players={players}
          playerNumbers={playerNumbers}
        />
      </svg>
    )

    const circle = container.querySelector('circle')

    const expectedX = 300 + ((5.8 + 0.5) / 40) * 1320
    const expectedY = 150 + ((10.3 + 0.5) / 20) * 800

    expect(circle).toHaveAttribute('cx', String(expectedX))
    expect(circle).toHaveAttribute('cy', String(expectedY))
  })

  it('calcula correctamente la posición cerca del borde opuesto de la cancha', () => {
    const players = [
      { player_id: 1, x: 39.5, y: 19.5, team: 'A', is_on_field: true }
    ]
    const playerNumbers = { 1: 1 }

    const { container } = render(
      <svg>
        <MatchPlayerInMatch players={players} playerNumbers={playerNumbers} />
      </svg>
    )

    const circle = container.querySelector('circle')
    const expectedX = 300 + ((39.5 + 0.5) / 40) * 1320
    const expectedY = 150 + ((19.5 + 0.5) / 20) * 800

    expect(circle).toHaveAttribute('cx', String(expectedX))
    expect(circle).toHaveAttribute('cy', String(expectedY))
  })

  it('no dibuja jugadores que no están en cancha', () => {
    const players = [
      {
        player_id: 1,
        x: 5,
        y: 10,
        team: 'A',
        is_on_field: false
      }
    ]

    const playerNumbers = {
      1: 7
    }

    const { container } = render(
      <svg>
        <MatchPlayerInMatch
          players={players}
          playerNumbers={playerNumbers}
        />
      </svg>
    )

    expect(container.querySelectorAll('circle')).toHaveLength(0)
  })

  it('no dibuja jugadores si is_on_field no está definido', () => {
    const players = [
      {
        player_id: 1,
        x: 5,
        y: 10,
        team: 'A'
      }
    ]

    const playerNumbers = {
      1: 7
    }

    const { container } = render(
      <svg>
        <MatchPlayerInMatch
          players={players}
          playerNumbers={playerNumbers}
        />
      </svg>
    )

    expect(container.querySelectorAll('circle')).toHaveLength(0)
  })

  it('no dibuja jugadores cuando la lista está vacía', () => {
    const { container } = render(
      <svg>
        <MatchPlayerInMatch
          players={[]}
          playerNumbers={{}}
        />
      </svg>
    )

    expect(container.querySelectorAll('circle')).toHaveLength(0)
  })
})