import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LeagueListView from "./LeagueListView";
import { useSessionSocket } from "../../auth/SessionSocketProvider";

const { replaceJoinedLIds, getMyLeagueIds } = vi.hoisted(() => ({
  replaceJoinedLIds: vi.fn(),
  getMyLeagueIds: vi.fn(),
}));


vi.mock("../LeaguesProvider", () => ({
  useLeaguesSocket: () => ({ replaceJoinedLIds }),
}));
vi.mock("../api", () => ({ getMyLeagueIds }));

let mockLocation = { pathname: "/league", state: null };
const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate, useLocation: () => mockLocation }));

vi.mock("../../auth/SessionSocketProvider", () => ({
  useSessionSocket: vi.fn(),
}));

// Se mockean los hijos: acá solo se prueba la lógica de la vista de lista.
vi.mock("../components/CreateL", () => ({
  default: ({ onClose, roster }) => (
    <div role="dialog" aria-label="Crear liga">
      <span data-testid="create-roster">{roster ? "con roster" : "sin roster"}</span>
      <button onClick={onClose}>cerrar modal</button>
    </div>
  ),
}));

vi.mock("../components/LeagueCard", () => ({
  LeagueCard: ({ league, roster }) => (
    <div data-testid={`card-${league.league_id}`}>
      {league.name} {roster ? "con roster" : "sin roster"}
    </div>
  ),
}));

vi.mock("../../roster/components/RosterBuilder", () => ({
  RosterBuilder: ({ onSubmit, onCancel }) => (
    <div data-testid="roster-builder">
      <button onClick={() => onSubmit({ formation: "offensive", players: [] })}>
        confirmar plantilla
      </button>
      <button onClick={onCancel}>cancelar plantilla</button>
    </div>
  ),
}));

beforeEach(() => {
  mockLocation = { pathname: "/league", state: null };
  navigate.mockClear();
  replaceJoinedLIds.mockReset();
  getMyLeagueIds.mockReset().mockResolvedValue([]);
  useSessionSocket.mockReturnValue({ isConnected: true, messages: { leagues: [] } });
});
afterEach(cleanup);

const leagues = [
  { league_id: 1, name: "Liga Uno", current_participants: 2, capacity: 4, privacy: "PUBLICA", state: "POR_COMENZAR" },
  { league_id: 2, name: "Liga Dos", current_participants: 4, capacity: 4, privacy: "PRIVADA", state: "INICIADA" },
];

describe("LeagueListView", () => {
  describe("render", () => {
    it("muestra el título y el botón para volver al menú", () => {
      render(<LeagueListView />);
      expect(screen.getByRole("heading", { level: 1, name: "LIGAS" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Volver al menú" })).toBeInTheDocument();
    });

    it("muestra el botón para crear liga y no abre el modal al iniciar", () => {
      render(<LeagueListView />);
      expect(screen.getByRole("button", { name: "CREAR LIGA" })).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("notifica cuando todavía no se cargó la plantilla", () => {
      render(<LeagueListView />);
      expect(screen.getByText("La plantilla todavía no ha sido cargada.")).toBeInTheDocument();
    });
  });

  describe("volver al menú", () => {
    it("navega a la raíz al hacer click en Volver al menú", async () => {
      const user = userEvent.setup();
      render(<LeagueListView />);

      await user.click(screen.getByRole("button", { name: "Volver al menú" }));

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith("/");
    });
  });

  describe("lista de ligas", () => {
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

    it("lista todas las ligas recibidas usando league_id como clave", () => {
      useSessionSocket.mockReturnValue({ isConnected: true, messages: { leagues } });
      render(<LeagueListView />);

      expect(screen.getByTestId("card-1")).toHaveTextContent("Liga Uno");
      expect(screen.getByTestId("card-2")).toHaveTextContent("Liga Dos");
      expect(screen.getByText("2 disponibles")).toBeInTheDocument();
    });

    it("se actualiza cuando llegan nuevas ligas por el WebSocket", () => {
      const { rerender } = render(<LeagueListView />);
      expect(screen.queryByTestId("card-1")).not.toBeInTheDocument();

      useSessionSocket.mockReturnValue({ isConnected: true, messages: { leagues } });
      rerender(<LeagueListView />);

      expect(screen.getByTestId("card-1")).toBeInTheDocument();
    });
  });

  describe("creación de liga", () => {
    it("abre el modal de creación al hacer click en CREAR LIGA", async () => {
      const user = userEvent.setup();
      render(<LeagueListView />);

      await user.click(screen.getByRole("button", { name: "CREAR LIGA" }));

      expect(screen.getByRole("dialog", { name: "Crear liga" })).toBeInTheDocument();
    });

    it("cierra el modal cuando CreateL llama a onClose", async () => {
      const user = userEvent.setup();
      render(<LeagueListView />);
      await user.click(screen.getByRole("button", { name: "CREAR LIGA" }));

      await user.click(screen.getByRole("button", { name: "cerrar modal" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("plantilla (roster) compartida", () => {
    it("abre y cancela el editor de plantilla", async () => {
      const user = userEvent.setup();
      render(<LeagueListView />);

      await user.click(screen.getByRole("button", { name: "EDITAR" }));
      expect(screen.getByTestId("roster-builder")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "cancelar plantilla" }));
      expect(screen.queryByTestId("roster-builder")).not.toBeInTheDocument();
      expect(screen.getByText("La plantilla todavía no ha sido cargada.")).toBeInTheDocument();
    });

    it("al confirmar oculta la notificación y pasa el roster a CreateL y a las tarjetas", async () => {
      useSessionSocket.mockReturnValue({ isConnected: true, messages: { leagues } });
      const user = userEvent.setup();
      render(<LeagueListView />);

      await user.click(screen.getByRole("button", { name: "EDITAR" }));
      await user.click(screen.getByRole("button", { name: "confirmar plantilla" }));

      expect(screen.queryByText("La plantilla todavía no ha sido cargada.")).not.toBeInTheDocument();
      expect(screen.getByTestId("card-1")).toHaveTextContent("con roster");

      await user.click(screen.getByRole("button", { name: "CREAR LIGA" }));
      expect(screen.getByTestId("create-roster")).toHaveTextContent("con roster");
    });
  });
});

describe("recuperación de participación", () => {
  it("consulta al entrar, reemplaza los IDs y consulta nuevamente al regresar", async () => {
    getMyLeagueIds.mockResolvedValue([2, 5]);
    const view = render(<LeagueListView />);
    await waitFor(() => expect(replaceJoinedLIds).toHaveBeenCalledWith([2, 5]));
    view.unmount();
    render(<LeagueListView />);
    await waitFor(() => expect(getMyLeagueIds).toHaveBeenCalledTimes(2));
  });

  it("no reemplaza los IDs si falla la petición", async () => {
    const error = new Error("Sin conexión");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getMyLeagueIds.mockRejectedValue(error);
    render(<LeagueListView />);
    await waitFor(() => expect(log).toHaveBeenCalled());
    expect(replaceJoinedLIds).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it.each(["unmount", "auth:logout", "auth:expired"])("ignora respuestas pendientes tras %s", async (event) => {
    let resolve;
    getMyLeagueIds.mockReturnValue(new Promise((done) => { resolve = done; }));
    const view = render(<LeagueListView />);
    if (event === "unmount") view.unmount();
    else act(() => window.dispatchEvent(new Event(event)));
    await act(async () => resolve([2]));
    expect(replaceJoinedLIds).not.toHaveBeenCalled();
  });
});

describe("Buscador de ligas", () => {
  const entries = [
    { league_id: 1, name: "Club Norte" },
    { league_id: 2, name: "Club Sur" }
  ];

  it("filtra coincidencias parciales sin distinguir mayúsculas y restaura la lista al borrar", async () => {
    useSessionSocket.mockReturnValue({ messages: { leagues: entries } });

    const user = userEvent.setup();
    render(<LeagueListView />);

    expect(screen.getByText("2 disponibles")).toBeInTheDocument();

    const input = screen.getByRole("searchbox", { name: "Buscar ligas" });

    await user.type(input, "nOr");

    expect(screen.getByTestId("card-1")).toHaveTextContent("Club Norte");
    expect(screen.queryByTestId("card-2")).not.toBeInTheDocument();
    expect(screen.getByText("1 disponibles")).toBeInTheDocument();

    await user.clear(input);

    expect(screen.getByTestId("card-2")).toBeInTheDocument();

    await user.type(input, "inexistente");

    expect(screen.getByText("No se encontraron resultados.")).toBeInTheDocument();
  });

  it("mantiene el filtro al recibir actualizaciones del WebSocket", async () => {
    useSessionSocket.mockReturnValue({ messages: { leagues: entries } });

    const user = userEvent.setup();
    const { rerender } = render(<LeagueListView />);

    await user.type(
      screen.getByRole("searchbox", { name: "Buscar ligas" }),
      "norte"
    );

    useSessionSocket.mockReturnValue({
      messages: {
        leagues: [
          entries[1],
          { league_id: 3, name: "Norte Unido" }
        ]
      }
    });

    rerender(<LeagueListView />);

    expect(screen.getByTestId("card-3")).toHaveTextContent("Norte Unido");
    expect(screen.queryByTestId("card-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-2")).not.toBeInTheDocument();

    expect(screen.getByRole("searchbox", { name: "Buscar ligas" }))
      .toHaveValue("norte");
  });
});

it("notifica la cancelación y excluye la liga de la lista y de la recuperación de participaciones", async () => {
  mockLocation = { pathname: "/league", state: { cancelledLeagueId: 1 } };
  getMyLeagueIds.mockResolvedValue([1, 2]);
  useSessionSocket.mockReturnValue({ messages: { leagues } });

  render(<LeagueListView />);

  expect(await screen.findByText("La liga fue cancelada correctamente.")).toBeInTheDocument();
  expect(screen.queryByTestId("card-1")).not.toBeInTheDocument();
  expect(screen.getByTestId("card-2")).toBeInTheDocument();
  await waitFor(() => expect(replaceJoinedLIds).toHaveBeenCalledWith([2]));
  expect(navigate).toHaveBeenCalledWith("/league", { replace: true, state: null });
});

it("al volver por cancelación del creador informa el motivo y mantiene oculta la liga ante actualizaciones", async () => {
  mockLocation = { pathname: "/league", state: { cancelledLeagueId: 1, cancelledByCreator: true } };
  useSessionSocket.mockReturnValue({ messages: { leagues } });
  const { rerender } = render(<LeagueListView />);

  expect(await screen.findByText("El creador canceló la liga.")).toBeInTheDocument();

  mockLocation = { pathname: "/league", state: null };
  useSessionSocket.mockReturnValue({ messages: { leagues: [...leagues] } });
  rerender(<LeagueListView />);

  expect(screen.queryByTestId("card-1")).not.toBeInTheDocument();
  expect(screen.getByTestId("card-2")).toBeInTheDocument();
  expect(screen.getByText("El creador canceló la liga.")).toBeInTheDocument();
});
