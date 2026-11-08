import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import DiscardRosterChanges from "./DiscardRosterChanges"

describe("DiscardRosterChanges", () => {
  it("explica el descarte y permite continuar sin confirmar", async () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(<DiscardRosterChanges onCancel={onCancel} onConfirm={onConfirm} />)
    expect(screen.getByText("Tenés cambios sin guardar. ¿Querés descartarlos y cerrar?")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Seguir editando" }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("confirma el descarte únicamente al pulsar Descartar y cerrar", async () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(<DiscardRosterChanges onCancel={onCancel} onConfirm={onConfirm} />)
    expect(onConfirm).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("button", { name: "Descartar y cerrar" }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })
})
