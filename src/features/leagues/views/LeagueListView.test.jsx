import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LeagueListView from "./LeagueListView";
import { useSessionSocket } from "../../auth/SessionSocketProvider";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

vi.mock("../../auth/SessionSocketProvider", () => ({
  useSessionSocket: vi.fn(),
}));

beforeEach(() => {
  navigate.mockClear();
  useSessionSocket.mockReturnValue({ isConnected: true, messages: { leagues: [] } });
});
afterEach(cleanup);

const leagues = [
  { league_id: 1, name: "Liga Uno", current_participants: 2, capacity: 4, privacy: "PUBLICA", state: "POR_COMENZAR" },
  { league_id: 2, name: "Liga Dos", current_participants: 4, capacity: 4, privacy: "PRIVADA", state: "JUGANDO" },
];

describe("LeagueListView", () => {
  it("muestra el título y el botón para volver al menú", () => {
    render(<LeagueListView />);
    expect(screen.getByRole("heading", { level: 1, name: "LIGAS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver al menú" })).toBeInTheDocument();
  });

  it("navega a la raíz al hacer click en Volver al menú", async () => {
    const user = userEvent.setup();
    render(<LeagueListView />);

    await user.click(screen.getByRole("button", { name: "Volver al menú" }));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("muestra un mensaje cuando no hay ligas", () => {
    render(<LeagueListView />);
    expect(screen.getByText("No hay ligas disponibles.")).toBeInTheDocument();
    expect(screen.getByText("0 disponibles")).toBeInTheDocument();
  });

  it("no falla si los mensajes de sesión aún no contienen ligas", () => {
    useSessionSocket.mockReturnValue({ isConnected: false, messages: "" });
    render(<LeagueListView />);
    expect(screen.getByText("No hay ligas disponibles.")).toBeInTheDocument();
  });

  it("lista todas las ligas recibidas con sus datos", () => {
    useSessionSocket.mockReturnValue({ isConnected: true, messages: { leagues } });
    render(<LeagueListView />);

    expect(screen.getByText("Liga Uno")).toBeInTheDocument();
    expect(screen.getByText("Liga Dos")).toBeInTheDocument();
    expect(screen.getByText("2 disponibles")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Unirse" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Ver" })).toHaveLength(2);
  });

  it("se actualiza cuando llegan nuevas ligas por el WebSocket", () => {
    const { rerender } = render(<LeagueListView />);
    expect(screen.queryByText("Liga Uno")).not.toBeInTheDocument();

    useSessionSocket.mockReturnValue({ isConnected: true, messages: { leagues } });
    rerender(<LeagueListView />);

    expect(screen.getByText("Liga Uno")).toBeInTheDocument();
  });
});

