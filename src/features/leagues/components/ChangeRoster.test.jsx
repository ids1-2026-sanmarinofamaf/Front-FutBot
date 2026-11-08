import { act, render, screen, within, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ChangeRoster from "./ChangeRoster"
import { getLeagueRoster, updateLeagueRoster } from "../api"
import { getBehaviors } from "../../behaviors/api"
import { getPlayers } from "../../player/api"

// ✓ ChangeRoster: carga (6)
//      ✓ carga las tres fuentes y espera a que todas respondan 120ms
//      ✓ notifica y cierra si una fuente falla (0) 7ms
//      ✓ notifica y cierra si una fuente falla (1) 6ms
//      ✓ notifica y cierra si una fuente falla (2) 7ms
//      ✓ ignora errores pendientes después de desmontar el modal 3ms
//      ✓ usa un nombre alternativo si el club ya no devuelve al jugador 17ms
//    ✓ ChangeRoster: edición y validación (13)
//      ✓ cambia solo la formación y detecta cuando se deshace 69ms
//      ✓ cambia comportamientos sin is_valid y detecta que se restauró el original 64ms
//      ✓ limita a tres titulares y asigna el slot libre al reemplazo conservando los otros 83ms
//      ✓ deshabilita el guardado al liberar un slot y bloquea posiciones ocupadas 106ms
//      ✓ no permite guardar con titulares insuficientes 44ms
//      ✓ no permite guardar con titulares de más 49ms
//      ✓ no permite guardar con slot ausente 47ms
//      ✓ no permite guardar con slots repetidos 45ms
//      ✓ no permite guardar con slot inválido 41ms
//      ✓ no permite guardar con slot en suplente 44ms
//      ✓ no permite guardar con jugador repetido 40ms
//      ✓ no permite guardar con cinco jugadores 36ms
//      ✓ no permite guardar con formación inválida 43ms
//    ✓ ChangeRoster: guardado (9)
//      ✓ envía una sola petición con los seis jugadores y solo los campos del contrato 81ms
//      ✓ con error 400 conserva cambios, muestra aviso y permite reintentar 82ms
//      ✓ con error 401 conserva cambios, muestra aviso y permite reintentar 91ms
//      ✓ con error 403 conserva cambios, muestra aviso y permite reintentar 81ms
//      ✓ con error 404 conserva cambios, muestra aviso y permite reintentar 76ms
//      ✓ con error 409 conserva cambios, muestra aviso y permite reintentar 78ms
//      ✓ con error 422 conserva cambios, muestra aviso y permite reintentar 84ms
//      ✓ con error 500 conserva cambios, muestra aviso y permite reintentar 76ms
//      ✓ con error undefined conserva cambios, muestra aviso y permite reintentar 78ms
//    ✓ ChangeRoster: cierre (3)
//      ✓ cierra directamente si no hay cambios, también después de deshacerlos 53ms
//      ✓ cancelar conserva los cambios y confirmar descarta sin PUT 90ms
//      ✓ al reabrir vuelve a consultar y muestra los datos actualizados 61ms

vi.mock("../api", () => ({ getLeagueRoster: vi.fn(), updateLeagueRoster: vi.fn() }))
vi.mock("../../behaviors/api", () => ({ getBehaviors: vi.fn() }))
vi.mock("../../player/api", () => ({ getPlayers: vi.fn() }))

const makeRoster = () => ({
  roster_id: 20,
  formation: "defensive",
  players: Array.from({ length: 6 }, (_, index) => ({
    player_id: index + 1,
    is_starter: index < 3,
    slot: ["left", "center", "right"][index] ?? null,
    initial_behavior_id: index < 3 ? 1 : null,
  })),
})
const clubPlayers = Array.from({ length: 7 }, (_, index) => ({ id: index + 1, name: `Nombre ${index + 1}` }))
const behaviors = [{ behavior_id: 1, name: "Defender" }, { behavior_id: 2, name: "Atacar" }]
const card = id => within(screen.getByText(`Nombre ${id}`).closest("li"))
const saveButton = () => screen.getByRole("button", { name: "Guardar alineación" })
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}
const setup = async () => {
  const callbacks = { onClose: vi.fn(), onLoadError: vi.fn(), onSaveSuccess: vi.fn() }
  const view = render(<ChangeRoster leagueId={150} {...callbacks} />)
  await screen.findByText("Nombre 1")
  return { ...view, ...callbacks, user: userEvent.setup() }
}
const editFormation = () => userEvent.selectOptions(screen.getByLabelText("Formación:"), "offensive")

beforeEach(() => {
  vi.resetAllMocks()
  getLeagueRoster.mockResolvedValue(makeRoster())
  getBehaviors.mockResolvedValue(behaviors)
  getPlayers.mockResolvedValue(clubPlayers)
  updateLeagueRoster.mockResolvedValue({})
})

describe("ChangeRoster: carga", () => {

  it("carga las tres fuentes y espera a que todas respondan", async () => {
    const pending = deferred() //función auxiliar de los tests que crea una promesa que podemos resolver o rechazar cuando queramos
    getPlayers.mockReturnValue(pending.promise)
    render(<ChangeRoster leagueId={150} onClose={vi.fn()} onLoadError={vi.fn()} onSaveSuccess={vi.fn()} />)
    expect(screen.getByText("Cargando alineación...")).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
    expect(getLeagueRoster).toHaveBeenCalledWith(150)
    expect(getBehaviors).toHaveBeenCalledTimes(1)
    expect(getPlayers).toHaveBeenCalledTimes(1)
    await act(async () => pending.resolve(clubPlayers))
    expect(screen.queryByText("Cargando alineación...")).not.toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(6)
    expect(screen.queryByText("Nombre 7")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Formación:")).toHaveValue("defensive")
    expect(within(screen.getByRole("heading", { name: "Titulares" }).closest("section")).getAllByRole("listitem")).toHaveLength(3)
    expect(within(screen.getByRole("heading", { name: "Suplentes" }).closest("section")).getAllByRole("listitem")).toHaveLength(3)
    expect(card(1).getByLabelText("Posición:")).toHaveValue("left")
    expect(card(1).getByLabelText("Comportamiento inicial:")).toHaveValue("1")
    expect(saveButton()).toBeDisabled()
  })

  it.each([getLeagueRoster, getBehaviors, getPlayers])("notifica y cierra si una fuente falla (%#)", async failingRequest => {
    failingRequest.mockRejectedValue(new Error("Sin conexión"))
    const onClose = vi.fn()
    const onLoadError = vi.fn()
    render(<ChangeRoster leagueId={150} onClose={onClose} onLoadError={onLoadError} onSaveSuccess={vi.fn()} />)
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onLoadError).toHaveBeenCalledWith("Error al cargar la alineación y los comportamientos.")
    expect(updateLeagueRoster).not.toHaveBeenCalled()
  })

  it("ignora errores pendientes después de desmontar el modal", async () => {
    const pending = deferred()
    getLeagueRoster.mockReturnValue(pending.promise)
    const onClose = vi.fn()
    const onLoadError = vi.fn()
    const view = render(<ChangeRoster leagueId={150} onClose={onClose} onLoadError={onLoadError} />)
    view.unmount()
    await act(async () => pending.reject(new Error("Tardío")))
    expect(onLoadError).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("usa un nombre alternativo si el club ya no devuelve al jugador", async () => {
    getPlayers.mockResolvedValue(clubPlayers.filter(player => player.id !== 6))
    await setup()
    expect(screen.getByText("Juancito Chiki Doe")).toBeInTheDocument()
  })
})

describe("ChangeRoster: edición y validación", () => {
  it("cambia solo la formación y detecta cuando se deshace", async () => {
    await setup()
    await editFormation()
    expect(saveButton()).not.toBeDisabled()
    expect(card(1).getByLabelText("Posición:")).toHaveValue("left")
    expect(card(1).getByLabelText("Comportamiento inicial:")).toHaveValue("1")
    expect(screen.getByText("Titulares: 3/3 · Suplentes: 3/3")).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText("Formación:"), "defensive")
    expect(saveButton()).toBeDisabled()
  })

  it("cambia comportamientos sin is_valid y detecta que se restauró el original", async () => {
    await setup()
    await userEvent.selectOptions(card(1).getByLabelText("Comportamiento inicial:"), "2")
    expect(saveButton()).not.toBeDisabled()
    await userEvent.selectOptions(card(1).getByLabelText("Comportamiento inicial:"), "1")
    expect(saveButton()).toBeDisabled()
  })

  it("limita a tres titulares y asigna el slot libre al reemplazo conservando los otros", async () => {
    const { user } = await setup()
    expect(card(4).getByRole("button", { name: "Pasar a titular" })).toBeDisabled()
    await user.click(card(1).getByRole("button", { name: "Pasar a suplente" }))
    expect(saveButton()).toBeDisabled()
    expect(screen.getByText("La alineación debe tener exactamente tres titulares y tres suplentes.")).toBeInTheDocument()
    expect(card(1).getByLabelText("Posición:")).toHaveValue("")
    await user.click(card(4).getByRole("button", { name: "Pasar a titular" }))
    expect(card(4).getByLabelText("Posición:")).toHaveValue("left")
    expect(card(2).getByLabelText("Posición:")).toHaveValue("center")
    expect(card(3).getByLabelText("Posición:")).toHaveValue("right")
    expect(saveButton()).not.toBeDisabled()
    expect(screen.getAllByRole("listitem")).toHaveLength(6)
    expect(screen.queryByText("Nombre 7")).not.toBeInTheDocument()
  })

  it("deshabilita el guardado al liberar un slot y bloquea posiciones ocupadas", async () => {
    await setup()
    const first = card(1).getByLabelText("Posición:")
    const second = card(2).getByLabelText("Posición:")
    await editFormation()
    expect(card(1).getByRole("option", { name: "center" })).toBeDisabled()
    await userEvent.selectOptions(first, "center")
    expect(first).toHaveValue("left")
    await userEvent.selectOptions(second, "")
    expect(saveButton()).toBeDisabled()
    expect(card(1).getByRole("option", { name: "center" })).not.toBeDisabled()
    await userEvent.selectOptions(first, "center")
    await userEvent.selectOptions(second, "left")
    expect(saveButton()).not.toBeDisabled()
  })

  it.each(["titulares insuficientes", "titulares de más", "slot ausente", "slots repetidos", "slot inválido", "slot en suplente", "jugador repetido", "cinco jugadores", "formación inválida"])("no permite guardar con %s", async scenario => {
    const roster = makeRoster()
    if (scenario === "titulares insuficientes") Object.assign(roster.players[0], { is_starter: false, slot: null })
    if (scenario === "titulares de más") Object.assign(roster.players[3], { is_starter: true, slot: null })
    if (scenario === "slot ausente") roster.players[0].slot = null
    if (scenario === "slots repetidos") roster.players[1].slot = "left"
    if (scenario === "slot inválido") roster.players[0].slot = "unknown"
    if (scenario === "slot en suplente") roster.players[3].slot = "left"
    if (scenario === "jugador repetido") roster.players[5].player_id = 4
    if (scenario === "cinco jugadores") roster.players.pop()
    if (scenario === "formación inválida") roster.formation = "unknown"
    getLeagueRoster.mockResolvedValue(roster)
    await setup()
    if (scenario === "formación inválida") await userEvent.selectOptions(card(1).getByLabelText("Comportamiento inicial:"), "2")
    else await editFormation()
    expect(saveButton()).toBeDisabled()
    await userEvent.click(saveButton())
    expect(updateLeagueRoster).not.toHaveBeenCalled()
  })
})

describe("ChangeRoster: guardado", () => {
  it("envía una sola petición con los seis jugadores y solo los campos del contrato", async () => {
    const pending = deferred()
    updateLeagueRoster.mockReturnValue(pending.promise)
    const { onClose, onSaveSuccess } = await setup()
    await editFormation()
    await userEvent.selectOptions(card(1).getByLabelText("Comportamiento inicial:"), "2")
    await userEvent.dblClick(saveButton())
    expect(updateLeagueRoster).toHaveBeenCalledTimes(1)
    expect(updateLeagueRoster).toHaveBeenCalledWith(150, {
      formation: "offensive",
      players: makeRoster().players.map(player => ({ ...player, initial_behavior_id: player.player_id === 1 ? 2 : player.initial_behavior_id })),
    })
    expect(screen.getByRole("button", { name: "Guardando alineación..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled()
    expect(screen.getByLabelText("Formación:")).toBeDisabled()
    await act(async () => pending.resolve({}))
    expect(onSaveSuccess).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByText("Descartar cambios")).not.toBeInTheDocument()
  })

  it.each([
    [400, "Todos los jugadores titulares deben tener comportamiento."],
    [401, "La sesión no es válida."],
    [403, "No participás en esta liga."],
    [404, "La liga no existe."],
    [409, "La liga no está en curso."],
    [422, "Los datos de la petición son inválidos."],
    [500, "Error al actualizar la alineación."],
    [undefined, "Error al actualizar la alineación."],
  ])("con error %s conserva cambios, muestra aviso y permite reintentar", async (status, message) => {
    updateLeagueRoster.mockRejectedValueOnce(Object.assign(new Error("Fallo"), { status }))
    const { onClose, onSaveSuccess } = await setup()
    await editFormation()
    await userEvent.selectOptions(card(1).getByLabelText("Comportamiento inicial:"), "2")
    await userEvent.click(saveButton())
    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    expect(screen.getByLabelText("Formación:")).toHaveValue("offensive")
    expect(card(1).getByLabelText("Comportamiento inicial:")).toHaveValue("2")
    expect(card(1).getByLabelText("Posición:")).toHaveValue("left")
    expect(onClose).not.toHaveBeenCalled()
    expect(onSaveSuccess).not.toHaveBeenCalled()
    expect(saveButton()).not.toBeDisabled()
    await userEvent.click(saveButton())
    await waitFor(() => expect(onSaveSuccess).toHaveBeenCalledTimes(1))
    expect(updateLeagueRoster).toHaveBeenCalledTimes(2)
    expect(updateLeagueRoster.mock.calls[1]).toEqual(updateLeagueRoster.mock.calls[0])
  })
})

describe("ChangeRoster: cierre", () => {
  it("cierra directamente si no hay cambios, también después de deshacerlos", async () => {
    const { onClose } = await setup()
    await editFormation()
    await userEvent.selectOptions(screen.getByLabelText("Formación:"), "defensive")
    await userEvent.click(screen.getByRole("button", { name: "Cerrar" }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByText("Descartar cambios")).not.toBeInTheDocument()
    expect(updateLeagueRoster).not.toHaveBeenCalled()
  })

  it("cancelar conserva los cambios y confirmar descarta sin PUT", async () => {
    const { onClose } = await setup()
    await editFormation()
    await userEvent.click(screen.getByRole("button", { name: "Cerrar" }))
    expect(screen.getByText("Descartar cambios")).toBeInTheDocument()
    expect(screen.getByLabelText("Formación:")).toBeDisabled()
    expect(saveButton()).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: "Seguir editando" }))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Formación:")).toHaveValue("offensive")
    await userEvent.click(screen.getByRole("button", { name: "Cerrar" }))
    await userEvent.click(screen.getByRole("button", { name: "Descartar y cerrar" }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(updateLeagueRoster).not.toHaveBeenCalled()
  })

  it("al reabrir vuelve a consultar y muestra los datos actualizados", async () => {
    const first = await setup()
    await editFormation()
    await userEvent.click(saveButton())
    await waitFor(() => expect(first.onClose).toHaveBeenCalledTimes(1))
    first.unmount()
    const updated = makeRoster()
    updated.formation = "offensive"
    getLeagueRoster.mockResolvedValue(updated)
    await setup()
    expect(getLeagueRoster).toHaveBeenCalledTimes(2)
    expect(getBehaviors).toHaveBeenCalledTimes(2)
    expect(getPlayers).toHaveBeenCalledTimes(2)
    expect(screen.getByLabelText("Formación:")).toHaveValue("offensive")
    expect(saveButton()).toBeDisabled()
  })
})
