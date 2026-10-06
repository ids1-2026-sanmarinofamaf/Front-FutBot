import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { ExitMatchButton } from './ExitMatchButton'
import { useNavigate } from 'react-router-dom'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}))

describe('ExitMatchButton', () => {
  const navigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useNavigate.mockReturnValue(navigate)
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

  it('vuelve a la página anterior al hacer click', async () => {
    const user = userEvent.setup()

    render(<ExitMatchButton />)

    await user.click(
      screen.getByRole('button', { name: 'Salir del partido' })
    )

    expect(navigate).toHaveBeenCalledWith(-1)
  })

  it('es un botón de tipo button', () => {
    render(<ExitMatchButton />)

    expect(
      screen.getByRole('button', { name: 'Salir del partido' })
    ).toHaveAttribute('type', 'button')
  })

})