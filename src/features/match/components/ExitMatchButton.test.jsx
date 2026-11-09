import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { ExitMatchButton } from './ExitMatchButton'
import { useNavigate, useLocation } from 'react-router-dom'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn()
}))

describe('ExitMatchButton', () => {
  const navigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useNavigate.mockReturnValue(navigate)
    useLocation.mockReturnValue({ state: null })
  })

  it('muestra el botón para salir del partido', () => {
    render(<svg><ExitMatchButton /></svg>)

    expect(
      screen.getByRole('button', { name: 'Salir del partido' })
    ).toBeInTheDocument()
  })

  it('se posiciona debajo del último titular sin superponerse con la cancha', () => {
    const { container } = render(<svg><ExitMatchButton /></svg>)
    const foreignObject = container.querySelector('foreignObject')

    expect(foreignObject).toHaveAttribute('x', '30')
    expect(foreignObject).toHaveAttribute('y', '865')
    expect(foreignObject).toHaveAttribute('width', '220')
    expect(foreignObject).toHaveAttribute('height', '55')
  })

  it('ejecuta navigate al hacer click en el botón', async () => {
    const user = userEvent.setup()

    render(<svg><ExitMatchButton /></svg>)

    await user.click(
      screen.getByRole('button', { name: 'Salir del partido' })
    )

    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('vuelve a la página anterior al hacer click cuando no viene como espectador', async () => {
    const user = userEvent.setup()

    render(<svg><ExitMatchButton /></svg>)

    await user.click(
      screen.getByRole('button', { name: 'Salir del partido' })
    )

    expect(navigate).toHaveBeenCalledWith(-1)
  })

  it('redirige a /friendly si proviene desde la lista como espectador', async () => {
    useLocation.mockReturnValue({ state: { from: '/friendly' } })
    const user = userEvent.setup()

    render(<svg><ExitMatchButton /></svg>)

    await user.click(
      screen.getByRole('button', { name: 'Salir del partido' })
    )

    expect(navigate).toHaveBeenCalledWith('/friendly', { replace: true })
  })

  it('redirige al lobby de la liga si proviene desde fixture de liga con state.from', async () => {
    useLocation.mockReturnValue({
      state: { from: '/league/lobby/10/Liga%20San%20Marino' }
    })
    const user = userEvent.setup()

    render(<svg><ExitMatchButton /></svg>)

    await user.click(
      screen.getByRole('button', { name: 'Salir del partido' })
    )

    expect(navigate).toHaveBeenCalledWith(
      '/league/lobby/10/Liga%20San%20Marino',
      { replace: true }
    )
  })

  it('es un botón de tipo button', () => {
    render(<svg><ExitMatchButton /></svg>)

    expect(
      screen.getByRole('button', { name: 'Salir del partido' })
    ).toHaveAttribute('type', 'button')
  })
})