import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import RosterSection from "./RosterSection"

const players = [
  { player_id: 1, name: "Chiki", is_starter: true, slot: "left", initial_behavior_id: 1 },
  { player_id: 2, name: "Dos", is_starter: true, slot: "center", initial_behavior_id: 1 },
]
const behaviors = [{ behavior_id: 1, name: "Defender" }, { behavior_id: 2, name: "Atacar" }]

describe("RosterSection", () => {

  it("muestra los jugadores de la sección y comunica sus cambios, bloqueando posiciones ocupadas por otros titulares", async () => {
    const onSlotChange = vi.fn()
    const onBehaviorChange = vi.fn()
    const onStarterChange = vi.fn()
    render(<RosterSection title="Titulares" players={players} behaviors={behaviors} onSlotChange={onSlotChange} onBehaviorChange={onBehaviorChange} onStarterChange={onStarterChange} />)
    expect(screen.getByRole("heading", { name: "Titulares" })).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    const first = within(screen.getByText("Chiki").closest("li"))
    expect(first.getByRole("option", { name: "left" })).not.toBeDisabled()
    expect(first.getByRole("option", { name: "center" })).toBeDisabled()
    await userEvent.selectOptions(first.getByLabelText("Posición:"), "right")
    expect(onSlotChange).toHaveBeenCalledWith(1, "right")
    await userEvent.selectOptions(first.getByLabelText("Comportamiento inicial:"), "2")
    expect(onBehaviorChange).toHaveBeenCalledWith(1, "2")
    await userEvent.click(first.getByRole("button", { name: "Pasar a suplente" }))
    expect(onStarterChange).toHaveBeenCalledWith(1)
  })

  it("transmite el bloqueo de promoción a todos los suplentes", () => {
    render(<RosterSection title="Suplentes" players={players.map(player => ({ ...player, is_starter: false, slot: null }))} behaviors={behaviors} disablePromotion />)
    screen.getAllByRole("button", { name: "Pasar a titular" }).forEach(button => expect(button).toBeDisabled())
  })

  it("admite una sección vacía", () => {
    render(<RosterSection title="Suplentes" players={[]} behaviors={[]} />)
    expect(screen.getByRole("heading", { name: "Suplentes" })).toBeInTheDocument()
    expect(screen.queryAllByRole("listitem")).toHaveLength(0)
  })
})
