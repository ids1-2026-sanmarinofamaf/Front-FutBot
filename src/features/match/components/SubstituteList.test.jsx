import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SubstituteList } from "./SubstituteList"

describe("SubstituteList", () => {
  const substitutes = [
    { player_id: 4, team: "A", is_on_field: false },
    { player_id: 5, team: "A", is_on_field: false },
    { player_id: 6, team: "A", is_on_field: false },
  ]

  const playersInfo = {
    4: { name: "Player 4" },
    5: { Name: "Player 5" },
  }

  it("muestra los nombres de los suplentes y 'Cargando...' si falta información", () => {
    render(
      <svg>
        <SubstituteList
          substitutes={substitutes}
          playersInfo={playersInfo}
          x={140}
          y={215}
          team="A"
          isSubmitting={false}
          error={null}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      </svg>
    )

    expect(screen.getByTestId("substitute-list-A")).toBeInTheDocument()
    expect(screen.getByTestId("substitute-option-4")).toHaveTextContent("Player 4")
    expect(screen.getByTestId("substitute-option-5")).toHaveTextContent("Player 5")
    expect(screen.getByTestId("substitute-option-6")).toHaveTextContent("Cargando...")
  })

  it("muestra 'Sin suplentes' cuando la lista está vacía", () => {
    render(
      <svg>
        <SubstituteList
          substitutes={[]}
          playersInfo={{}}
          x={140}
          y={215}
          team="A"
          isSubmitting={false}
          error={null}
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      </svg>
    )

    expect(screen.getByText("Sin suplentes")).toBeInTheDocument()
  })

  it("invoca onSelect con el suplente elegido y onCancel al cancelar", () => {
    const onSelect = vi.fn()
    const onCancel = vi.fn()

    render(
      <svg>
        <SubstituteList
          substitutes={substitutes}
          playersInfo={playersInfo}
          x={140}
          y={215}
          team="A"
          isSubmitting={false}
          error={null}
          onSelect={onSelect}
          onCancel={onCancel}
        />
      </svg>
    )

    fireEvent.click(screen.getByTestId("substitute-option-4"))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(substitutes[0])

    fireEvent.click(screen.getByTestId("cancel-substitution-A"))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it("muestra 'Realizando sustitución...' y deshabilita los botones cuando isSubmitting es true", () => {
    const onSelect = vi.fn()
    const onCancel = vi.fn()

    render(
      <svg>
        <SubstituteList
          substitutes={substitutes}
          playersInfo={playersInfo}
          x={140}
          y={215}
          team="A"
          isSubmitting={true}
          error={null}
          onSelect={onSelect}
          onCancel={onCancel}
        />
      </svg>
    )

    expect(screen.getByText("Realizando sustitución...")).toBeInTheDocument()

    const optionButton = screen.getByTestId("substitute-option-4")
    const cancelButton = screen.getByTestId("cancel-substitution-A")

    expect(optionButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()

    fireEvent.click(optionButton)
    fireEvent.click(cancelButton)

    expect(onSelect).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it("muestra el mensaje de error cuando se provee", () => {
    render(
      <svg>
        <SubstituteList
          substitutes={substitutes}
          playersInfo={playersInfo}
          x={140}
          y={215}
          team="B"
          isSubmitting={false}
          error="Se alcanzó el límite de sustituciones."
          onSelect={vi.fn()}
          onCancel={vi.fn()}
        />
      </svg>
    )

    expect(
      screen.getByText("Se alcanzó el límite de sustituciones.")
    ).toBeInTheDocument()
  })
})

