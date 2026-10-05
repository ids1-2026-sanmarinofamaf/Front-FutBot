import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MatchPlayerOut } from './MatchPlayerOut'
import { getPlayerById } from '../../player/api.js'

vi.mock('../../player/api.js', () => ({
  getPlayerById: vi.fn()
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

    getPlayerById.mockImplementation(function (id) {
      const player = players.find(function (p) { return p.player_id === id })
      if (player.team === 'B') {
        return Promise.reject(new Error('Not found'))
      }
      return Promise.resolve({ player_id: id, name: 'Player ' + id })
    })
  })

  function findRectAtXY(rects, x, y) {
    return Array.from(rects).find(function (r) {
      return r.getAttribute('x') === String(x) && r.getAttribute('y') === String(y)
    })
  }

  it('muestra 3 titulares y 3 suplentes por equipo', () => {
    const { container } = render(
      <svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>
    )
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(12)

    const starterTeamA = Array.from(rects).filter(r => r.getAttribute('x') === '40')
    const starterTeamB = Array.from(rects).filter(r => r.getAttribute('x') === '1790')
    const benchTeamA = Array.from(rects).filter(r => r.getAttribute('y') === '40' && Number(r.getAttribute('x')) < 1000)
    const benchTeamB = Array.from(rects).filter(r => r.getAttribute('y') === '40' && Number(r.getAttribute('x')) >= 1000)

    expect(starterTeamA).toHaveLength(3)
    expect(starterTeamB).toHaveLength(3)
    expect(benchTeamA).toHaveLength(3)
    expect(benchTeamB).toHaveLength(3)
  })

  it('apila correctamente a los titulares de cada equipo', () => {
    const { container } = render(
      <svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>
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
      <svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>
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
      <svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>
    )
    const rects = container.querySelectorAll('rect')
    const blueRects = Array.from(rects).filter(r => r.getAttribute('fill') === 'blue')
    const redRects = Array.from(rects).filter(r => r.getAttribute('fill') === 'red')
    expect(blueRects).toHaveLength(6)
    expect(redRects).toHaveLength(6)
  })

  it('no define opacidad explícita en los titulares, y usa 0.5 en los suplentes', () => {
    const { container } = render(
      <svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>
    )
    const rects = container.querySelectorAll('rect')
    const starterRects = Array.from(rects).filter(r => r.getAttribute('opacity') === null)
    const benchRects = Array.from(rects).filter(r => r.getAttribute('opacity') === '0.5')
    expect(starterRects).toHaveLength(6)
    expect(benchRects).toHaveLength(6)
  })

  it('obtiene los datos de cada jugador por su ID', async () => {
    render(<svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>)
    await waitFor(function () {
      expect(getPlayerById).toHaveBeenCalledTimes(12)
      players.forEach(function (player) {
        expect(getPlayerById).toHaveBeenCalledWith(player.player_id)
      })
    })
  })

  it('muestra los nombres propios y "Rival" para el equipo contrario', async () => {
    render(<svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>)
    await waitFor(function () {
      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('Player 6')).toBeInTheDocument()
      expect(screen.getAllByText('Rival')).toHaveLength(6)
    })
  })

  it('muestra el número solamente en los titulares', async () => {
    render(<svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>)
    await waitFor(function () {
      expect(screen.getAllByText('Number: 1')).toHaveLength(2)
      expect(screen.getAllByText('Number: 2')).toHaveLength(2)
      expect(screen.getAllByText('Number: 3')).toHaveLength(2)
    })
    expect(screen.queryByText('Number: 4')).not.toBeInTheDocument()
  })

  it('no rompe mientras los datos del jugador todavía no llegaron', () => {
    getPlayerById.mockImplementation(() => new Promise(() => {}))
    expect(function () {
      render(<svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>)
    }).not.toThrow()
  })

  it('no vuelve a pedir un jugador que ya fue cargado, ante un rerender', async () => {
    const { rerender } = render(<svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>)
    await waitFor(function () {
      expect(getPlayerById).toHaveBeenCalledTimes(12)
    })
    rerender(<svg><MatchPlayerOut players={players} playerNumbers={playerNumbers} /></svg>)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(getPlayerById).toHaveBeenCalledTimes(12)
  })

})