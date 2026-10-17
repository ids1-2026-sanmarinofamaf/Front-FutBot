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
    render(<ExitMatchButton />)

    expect(
      screen.getByRole('button', { name: 'Salir del partido' })
    ).toBeInTheDocument()
  })

  it('ejecuta navigate al hacer click en el botón', async () => {
    const user = userEvent.setup()

    render(<ExitMatchButton />)

    await user.click(
      screen.getByRole('button', { name: 'Salir del partido' })
    )

    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('vuelve a la página anterior al hacer click cuando no viene como espectador', async () => {
    const user = userEvent.setup()

    render(<ExitMatchButton />)

    await user.click(
      screen.getByRole('button', { name: 'Salir del partido' })
    )

    expect(navigate).toHaveBeenCalledWith(-1)
  })

  it('redirige a /friendly si proviene desde la lista como espectador', async () => {
    useLocation.mockReturnValue({ state: { from: '/friendly' } })
    const user = userEvent.setup()

    render(<ExitMatchButton />)

    await user.click(
      screen.getByRole('button', { name: 'Salir del partido' })
    )

    expect(navigate).toHaveBeenCalledWith('/friendly', { replace: true })
  })

  it('es un botón de tipo button', () => {
    render(<ExitMatchButton />)

    expect(
      screen.getByRole('button', { name: 'Salir del partido' })
    ).toHaveAttribute('type', 'button')
  })
})