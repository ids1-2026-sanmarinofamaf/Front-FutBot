import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import RosterPlayer from "./RosterPlayer"

const player = { player_id: 7, name: "Messi", is_starter: true, slot: "left", initial_behavior_id: 1 }
const behaviors = [{ behavior_id: 1, name: "Defender" }, { behavior_id: 2, name: "Atacar" }]
const setup = (props = {}) => {
  const callbacks = { onSlotChange: vi.fn(), onBehaviorChange: vi.fn(), onStarterChange: vi.fn() }
  render(<ul><RosterPlayer player={player} behaviors={behaviors} occupiedSlots={["center"]} {...callbacks} {...props} /></ul>)
  return callbacks
}

describe("RosterPlayer", () => {
  it("muestra nombre, posición y comportamiento actuales", () => {
    setup()
    expect(screen.getByText("Messi")).toBeInTheDocument()
    expect(screen.getByLabelText("Posición:")).toHaveValue("left")
    expect(screen.getByLabelText("Comportamiento inicial:")).toHaveValue("1")
    expect(screen.getByRole("option", { name: "Defender" })).toBeInTheDocument()
  })

  it("bloquea posiciones ocupadas y comunica posiciones libres o null", async () => {
    const { onSlotChange } = setup()
    const select = screen.getByLabelText("Posición:")
    expect(screen.getByRole("option", { name: "center" })).toBeDisabled()
    expect(screen.getByRole("option", { name: "left" })).not.toBeDisabled()
    await userEvent.selectOptions(select, "center")
    expect(onSlotChange).not.toHaveBeenCalled()
    await userEvent.selectOptions(select, "right")
    expect(onSlotChange).toHaveBeenLastCalledWith(7, "right")
    await userEvent.selectOptions(select, "")
    expect(onSlotChange).toHaveBeenLastCalledWith(7, "")
  })

  it("comunica cambios de comportamiento y permite quitarlo", async () => {
    const { onBehaviorChange } = setup()
    await userEvent.selectOptions(screen.getByLabelText("Comportamiento inicial:"), "2")
    expect(onBehaviorChange).toHaveBeenLastCalledWith(7, "2")
    await userEvent.selectOptions(screen.getByLabelText("Comportamiento inicial:"), "")
    expect(onBehaviorChange).toHaveBeenLastCalledWith(7, "")
  })

  // Este test comprueba qué pasa si un jugador tiene asignado un comportamiento que no está en la lista devuelta por la API. Se muestra para informar qué tenía asignado, pero, si elegís otro comportamiento, no podés volver a seleccionar el 99
  it("mantiene seleccionado un comportamiento ausente sin ofrecerlo como nueva selección", () => {
    setup({ player: { ...player, initial_behavior_id: 99 } })
    expect(screen.getByLabelText("Comportamiento inicial:")).toHaveValue("99")
    expect(screen.getByRole("option", { name: "Comportamiento 99" })).toBeDisabled()
  })

  it("solicita pasar un titular a suplente", async () => {
    const { onStarterChange } = setup()
    await userEvent.click(screen.getByRole("button", { name: "Pasar a suplente" }))
    expect(onStarterChange).toHaveBeenCalledWith(7)
  })

  it.each([false, true])("un suplente solo muestra nombre y botón, respetando disablePromotion=%s", async disablePromotion => {
    const { onStarterChange } = setup({
      player: { ...player, is_starter: false, slot: null, initial_behavior_id: null },
      disablePromotion,
    })
    expect(screen.getByText("Messi")).toBeInTheDocument()
    expect(screen.queryByLabelText("Posición:")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Comportamiento inicial:")).not.toBeInTheDocument()
    const button = screen.getByRole("button", { name: "Pasar a titular" })
    await userEvent.click(button)
    if (disablePromotion) {
      expect(button).toBeDisabled()
      expect(onStarterChange).not.toHaveBeenCalled()
    } else expect(onStarterChange).toHaveBeenCalledWith(7)
  })
})
