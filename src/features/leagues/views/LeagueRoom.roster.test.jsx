import { act, render, screen, within, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { LeagueLobby } from "./LeagueRoom"
import { getLeagueInfo, getLeagueRoster, getUserSessionInfo, updateLeagueRoster } from "../api"
import { getPlayers } from "../../player/api"
import { getBehaviors } from "../../behaviors/api"

vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn(), useParams: () => ({ id: "150", leagueName: "Liga 150" }) }))
const socket = vi.hoisted(() => ({ messages: {}, joinedLIds: [150], joinL: vi.fn(), leaveL: vi.fn() }))
vi.mock("../LeaguesProvider", () => ({ useLeaguesSocket: () => socket }))
vi.mock("../api", () => ({ getLeagueInfo: vi.fn(), getLeagueRoster: vi.fn(), getUserSessionInfo: vi.fn(), updateLeagueRoster: vi.fn() }))
vi.mock("../../friendlyGames/api", () => ({ getCurrentUser: async () => ({ user_name: "Club 1" }) }))
vi.mock("../../player/api", () => ({ getPlayers: vi.fn() }))
vi.mock("../../behaviors/api", () => ({ getBehaviors: vi.fn() }))
vi.mock("../components/LobbyUsers", () => ({ LobbyUsers: () => <div>Participantes</div> }))
vi.mock("../components/FixtureTab", () => ({ default: () => <div>Fixture</div> }))
vi.mock("../components/TablaTab", () => ({ default: () => <div>Tabla</div> }))

const roster = {
  formation: "defensive",
  players: Array.from({ length: 6 }, (_, index) => ({
    player_id: index + 1, is_starter: index < 3,
    slot: ["left", "center", "right"][index] ?? null,
    initial_behavior_id: index < 3 ? 1 : null,
  })),
}
const setState = state => {
  socket.messages = { 150: [{ type: "lobby_state", league_id: 150, state, current_users: 3, users: [{ club_id: 1, is_creator: true, user_name: "Club 1" }] }] }
  getLeagueInfo.mockResolvedValue({ state, fixture: [], standings: [] })
}
const renderLobby = async state => {
  setState(state)
  const view = render(<LeagueLobby />)
  await act(async () => {})
  return view
}
const openRoster = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Cambiar alineación" }))
  await screen.findByText("Jugador 1")
}

beforeEach(() => {
  vi.resetAllMocks()
  getLeagueRoster.mockResolvedValue(roster)
  getUserSessionInfo.mockResolvedValue({ user_id: 1 })
  getBehaviors.mockResolvedValue([{ behavior_id: 1, name: "Defender" }])
  getPlayers.mockResolvedValue(roster.players.map(player => ({ id: player.player_id, name: `Jugador ${player.player_id}` })))
  updateLeagueRoster.mockResolvedValue({})
})

describe("LeagueRoom: integración de cambio de alineación", () => {
  
  it.each(["POR_COMENZAR", "FINALIZADA"])("oculta el botón en estado %s", async state => {
    await renderLobby(state)
    expect(screen.queryByRole("button", { name: "Cambiar alineación" })).not.toBeInTheDocument()
    expect(getLeagueRoster).not.toHaveBeenCalled()
  })

  it("muestra el botón en INICIADA y consulta al abrir, no al entrar al lobby", async () => {
    await renderLobby("INICIADA")
    expect(screen.getByRole("button", { name: "Cambiar alineación" })).toBeInTheDocument()
    expect(getLeagueRoster).not.toHaveBeenCalled()
    await openRoster()
    expect(getLeagueRoster).toHaveBeenCalledWith(150)
    expect(getPlayers).toHaveBeenCalledTimes(1)
    expect(getBehaviors).toHaveBeenCalledTimes(1)
  })

  it("cierra y mantiene visible una notificación verde después de guardar", async () => {
    await renderLobby("INICIADA")
    await openRoster()
    await userEvent.selectOptions(screen.getByLabelText("Formación:"), "offensive")
    await userEvent.click(screen.getByRole("button", { name: "Guardar alineación" }))
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Alineación actualizada correctamente.")
    expect(alert.className).toContain("bg-green-100")
    expect(screen.queryByLabelText("Formación:")).not.toBeInTheDocument()
    expect(updateLeagueRoster).toHaveBeenCalledTimes(1)
    expect(updateLeagueRoster.mock.calls[0][0]).toBe(150)
  })

  it("vuelve a consultar al reabrir y refleja la formación guardada", async () => {
    await renderLobby("INICIADA")
    await openRoster()
    await userEvent.selectOptions(screen.getByLabelText("Formación:"), "offensive")
    await userEvent.click(screen.getByRole("button", { name: "Guardar alineación" }))
    await waitFor(() => expect(screen.queryByLabelText("Formación:")).not.toBeInTheDocument())
    getLeagueRoster.mockResolvedValue({ ...roster, formation: "offensive" })
    await openRoster()
    expect(getLeagueRoster).toHaveBeenCalledTimes(2)
    expect(screen.getByLabelText("Formación:")).toHaveValue("offensive")
    expect(screen.getByRole("button", { name: "Guardar alineación" })).toBeDisabled()
  })

  it("un fallo al cargar cierra el modal y deja el aviso en el lobby", async () => {
    getBehaviors.mockRejectedValue(new Error("Sin conexión"))
    await renderLobby("INICIADA")
    await userEvent.click(screen.getByRole("button", { name: "Cambiar alineación" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Error al cargar la alineación y los comportamientos.")
    expect(screen.queryByRole("button", { name: "Guardar alineación" })).not.toBeInTheDocument()
  })

  it("descarta cambios desde la nueva ventana sin enviar PUT", async () => {
    await renderLobby("INICIADA")
    await openRoster()
    await userEvent.selectOptions(screen.getByLabelText("Formación:"), "offensive")
    await userEvent.click(screen.getByRole("button", { name: "Cerrar", exact: true }))
    await userEvent.click(screen.getByRole("button", { name: "Seguir editando" }))
    expect(screen.getByLabelText("Formación:")).toHaveValue("offensive")
    await userEvent.click(screen.getByRole("button", { name: "Cerrar", exact: true }))
    await userEvent.click(screen.getByRole("button", { name: "Descartar y cerrar" }))
    expect(screen.queryByLabelText("Formación:")).not.toBeInTheDocument()
    expect(updateLeagueRoster).not.toHaveBeenCalled()
  })

  it("un error HTTP mantiene las modificaciones y muestra la notificación", async () => {
    updateLeagueRoster.mockRejectedValue(Object.assign(new Error("Conflicto"), { status: 409 }))
    await renderLobby("INICIADA")
    await openRoster()
    await userEvent.selectOptions(screen.getByLabelText("Formación:"), "offensive")
    await userEvent.click(screen.getByRole("button", { name: "Guardar alineación" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("La liga no está en curso.")
    expect(screen.getByLabelText("Formación:")).toHaveValue("offensive")
    expect(within(screen.getByText("Jugador 1").closest("li")).getByLabelText("Posición:")).toHaveValue("left")
  })
})
