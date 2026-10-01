import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MatchPlayerOut } from './MatchPlayerOut'

describe('MatchPlayerOut', () => {

  const players = [
    { player_id: 1, team: 1, onPitch: true, Name: 'Player 1' },
    { player_id: 2, team: 1, onPitch: true, Name: 'Player 2' },
    { player_id: 3, team: 1, onPitch: true, Name: 'Player 3' },
    { player_id: 4, team: 1, onPitch: false, Name: 'Player 4' },
    { player_id: 5, team: 1, onPitch: false, Name: 'Player 5' },
    { player_id: 6, team: 1, onPitch: false, Name: 'Player 6' },
    { player_id: 7, team: 2, onPitch: true, Name: 'Player 7' },
    { player_id: 8, team: 2, onPitch: true, Name: 'Player 8' },
    { player_id: 9, team: 2, onPitch: true, Name: 'Player 9' },
    { player_id: 10, team: 2, onPitch: false, Name: 'Player 10' },
    { player_id: 11, team: 2, onPitch: false, Name: 'Player 11' },
    { player_id: 12, team: 2, onPitch: false, Name: 'Player 12' }
  ]

  function findRectAtXY(rects, x, y) {
    return Array.from(rects).find(function (r) {
      return r.getAttribute('x') === String(x) && r.getAttribute('y') === String(y)
    })
  }

  it('tiene exactamente 3 titulares y 3 suplentes por equipo', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut players={players} />
      </svg>
    )

    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(12)

    const starterTeam1 = Array.from(rects).filter(function (r) {
      return r.getAttribute('x') === '40'
    })
    const starterTeam2 = Array.from(rects).filter(function (r) {
      return r.getAttribute('x') === '1790'
    })
    const benchTeam1 = Array.from(rects).filter(function (r) {
      return r.getAttribute('y') === '40' && Number(r.getAttribute('x')) < 1000
    })
    const benchTeam2 = Array.from(rects).filter(function (r) {
      return r.getAttribute('y') === '40' && Number(r.getAttribute('x')) >= 1000
    })

    expect(starterTeam1).toHaveLength(3)
    expect(starterTeam2).toHaveLength(3)
    expect(benchTeam1).toHaveLength(3)
    expect(benchTeam2).toHaveLength(3)
  })

  it('apila correctamente a los 3 titulares de un equipo, uno debajo del otro', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut players={players} />
      </svg>
    )

    const rects = container.querySelectorAll('rect')

    expect(findRectAtXY(rects, 40, 150)).toBeTruthy()
    expect(findRectAtXY(rects, 40, 250)).toBeTruthy()
    expect(findRectAtXY(rects, 40, 350)).toBeTruthy()
  })

  it('ubica en fila a los 3 suplentes de un equipo', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut players={players} />
      </svg>
    )

    const rects = container.querySelectorAll('rect')

    expect(findRectAtXY(rects, 320, 40)).toBeTruthy()
    expect(findRectAtXY(rects, 400, 40)).toBeTruthy()
    expect(findRectAtXY(rects, 480, 40)).toBeTruthy()
  })

  it('usa azul para el equipo 1 y rojo para el equipo 2, titulares y suplentes', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut players={players} />
      </svg>
    )

    const rects = container.querySelectorAll('rect')

    const team1Rects = Array.from(rects).filter(function (r) {
      return r.getAttribute('fill') === 'blue'
    })
    const team2Rects = Array.from(rects).filter(function (r) {
      return r.getAttribute('fill') === 'red'
    })

    expect(team1Rects).toHaveLength(6)
    expect(team2Rects).toHaveLength(6)
  })

  it('marca a los titulares con opacidad completa y a los suplentes con opacidad reducida', () => {
    const { container } = render(
      <svg>
        <MatchPlayerOut players={players} />
      </svg>
    )

    const rects = container.querySelectorAll('rect')

    const fullOpacity = Array.from(rects).filter(function (r) {
      return r.getAttribute('opacity') === '1'
    })
    const halfOpacity = Array.from(rects).filter(function (r) {
      return r.getAttribute('opacity') === '0.5'
    })

    expect(fullOpacity).toHaveLength(6)
    expect(halfOpacity).toHaveLength(6)
  })

  it('muestra los nombres de los 12 jugadores', () => {
    const { getByText } = render(
      <svg>
        <MatchPlayerOut players={players} />
      </svg>
    )

    players.forEach(function (p) {
      expect(getByText(p.Name)).toBeInTheDocument()
    })
  })

})