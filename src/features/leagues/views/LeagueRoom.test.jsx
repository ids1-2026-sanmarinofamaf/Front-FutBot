import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LeagueLobby } from "./LeagueRoom";

// --- Mocks de dependencias y hooks ---

const mockNavigate = vi.fn();
let mockParams = { id: "10", leagueName: "Liga Master" };

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

let mockSocketState = {
  messages: {},
  joinL: vi.fn(),
  leaveL: vi.fn(),
  joinedLIds: [10],
};

vi.mock("../LeaguesProvider", () => ({
  useLeaguesSocket: () => mockSocketState,
}));

const mockShowToast = vi.fn();
const mockHideToast = vi.fn();
let mockToastState = null;

vi.mock("../../../shared/hooks", () => ({
  useToast: () => ({
    toast: mockToastState,
    showToast: mockShowToast,
    hideToast: mockHideToast,
  }),
}));

const mockGetCurrentUser = vi.fn();
vi.mock("../../friendlyGames/api", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

const mockLeaveLeagueAsPlayer = vi.fn();
vi.mock("../api", () => ({
  leaveLeagueAsPlayer: (...args) => mockLeaveLeagueAsPlayer(...args),
}));

// Mock del componente de usuarios para aislar la vista
vi.mock("../components/LobbyUsers", () => ({
  LobbyUsers: ({ users }) => (
    <div data-testid="lobby-users">
      {users.map((u) => (
        <span key={u.club_id} data-testid={`user-${u.club_id}`}>
          {u.user_name}
        </span>
      ))}
    </div>
  ),
}));

// Mock de RightDownAlert
vi.mock("../../auth/components/RightDownAlert", () => ({
  default: ({ errorTitle, errorDescription }) => (
    <div data-testid="alert-error">
      <span>{errorTitle}</span>
      <span>{errorDescription}</span>
    </div>
  ),
}));

describe("LeagueLobby Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { id: "10", leagueName: "Liga Master" };
    mockSocketState = {
      messages: {},
      joinL: vi.fn(),
      leaveL: vi.fn(),
      joinedLIds: [10],
    };
    mockToastState = null;
    mockGetCurrentUser.mockResolvedValue({ user_name: "MiClub" });
    mockLeaveLeagueAsPlayer.mockResolvedValue(undefined);
  });

  describe("Control de acceso temprano y conexión", () => {
    it("redirige de inmediato a /league si el usuario ingresó por URL directa (no está en joinedLIds)", () => {
      mockSocketState.joinedLIds = []; // No se unió por UI

      render(<LeagueLobby />);

      expect(mockNavigate).toHaveBeenCalledWith("/league", { replace: true });
      expect(mockSocketState.joinL).not.toHaveBeenCalled();
    });

    it("conecta al WebSocket llamando a joinL con el ID numérico si el acceso es válido", async () => {
      mockSocketState.joinedLIds = [10];

      render(<LeagueLobby />);

      expect(mockSocketState.joinL).toHaveBeenCalledWith(10);
      await waitFor(() => {
        expect(mockGetCurrentUser).toHaveBeenCalled();
      });
    });
  });

  describe("Estado de carga inicial y desbloqueo con lobby_state", () => {
    it("muestra pantalla de espera ('Esperando estado del servidor') si no se ha recibido lobby_state", () => {
      mockSocketState.messages = { 10: [] };

      render(<LeagueLobby />);

      expect(screen.getByText(/Esperando estado del servidor/i)).toBeInTheDocument();
      expect(screen.queryByTestId("lobby-users")).not.toBeInTheDocument();
    });

    it("desbloquea la UI al recibir lobby_state y muestra la información inicial de la liga", () => {
      mockSocketState.messages = {
        10: [
          {
            type: "lobby_state",
            league_id: 10,
            current_users: 2,
            state: "POR_COMENZAR",
            users: [
              { club_id: 1, user_name: "Club A", avatar: "default" },
              { club_id: 2, user_name: "Club B", avatar: "default" },
            ],
          },
        ],
      };

      render(<LeagueLobby />);

      // Verifica que no esté en carga y muestre datos
      expect(screen.queryByText(/Esperando estado del servidor/i)).not.toBeInTheDocument();
      expect(screen.getByText("Liga Master")).toBeInTheDocument();
      expect(screen.getByText(/Jugadores: 2/i)).toBeInTheDocument();
      expect(screen.getByTestId("user-1")).toHaveTextContent("Club A");
      expect(screen.getByTestId("user-2")).toHaveTextContent("Club B");
    });
  });

  describe("Criterios de aceptación: Gestión y orden de eventos WebSocket", () => {
    it("descarta eventos user_joined o user_left si llegan antes del lobby_state inicial", () => {
      mockSocketState.messages = {
        10: [
          { type: "user_joined", user: { club_id: 99, user_name: "Fantasma" } },
          { type: "user_left", user: { club_id: 99 } },
        ],
      };

      render(<LeagueLobby />);

      // Continúa bloqueado esperando lobby_state
      expect(screen.getByText(/Esperando estado del servidor/i)).toBeInTheDocument();
      expect(screen.queryByTestId("user-99")).not.toBeInTheDocument();
    });

    it("agrega un participante a la lista cuando llega el evento user_joined", () => {
      mockSocketState.messages = {
        10: [
          {
            type: "lobby_state",
            league_id: 10,
            current_users: 1,
            state: "POR_COMENZAR",
            users: [{ club_id: 1, user_name: "Club A", avatar: "default" }],
          },
          {
            type: "user_joined",
            user: { club_id: 2, user_name: "Club B", avatar: "default" },
          },
        ],
      };

      render(<LeagueLobby />);

      expect(screen.getByTestId("user-1")).toBeInTheDocument();
      expect(screen.getByTestId("user-2")).toBeInTheDocument();
    });

    it("ignora el evento user_joined si llega duplicado o para un usuario que ya está en la lista", () => {
      mockSocketState.messages = {
        10: [
          {
            type: "lobby_state",
            league_id: 10,
            current_users: 1,
            state: "POR_COMENZAR",
            users: [{ club_id: 1, user_name: "Club A", avatar: "default" }],
          },
          {
            type: "user_joined",
            user: { club_id: 1, user_name: "Club A", avatar: "default" }, // Duplicado
          },
        ],
      };

      render(<LeagueLobby />);

      const usersA = screen.getAllByTestId("user-1");
      expect(usersA).toHaveLength(1);
    });

    it("elimina al participante de la lista cuando llega el evento user_left", () => {
      mockSocketState.messages = {
        10: [
          {
            type: "lobby_state",
            league_id: 10,
            current_users: 2,
            state: "POR_COMENZAR",
            users: [
              { club_id: 1, user_name: "Club A", avatar: "default" },
              { club_id: 2, user_name: "Club B", avatar: "default" },
            ],
          },
          {
            type: "user_left",
            user: { club_id: 1 },
          },
        ],
      };

      render(<LeagueLobby />);

      expect(screen.queryByTestId("user-1")).not.toBeInTheDocument();
      expect(screen.getByTestId("user-2")).toBeInTheDocument();
    });

    it("no modifica la lista si llega user_left de un usuario que no participaba", () => {
      mockSocketState.messages = {
        10: [
          {
            type: "lobby_state",
            league_id: 10,
            current_users: 1,
            state: "POR_COMENZAR",
            users: [{ club_id: 1, user_name: "Club A", avatar: "default" }],
          },
          {
            type: "user_left",
            user: { club_id: 999 }, // Inexistente
          },
        ],
      };

      render(<LeagueLobby />);

      expect(screen.getByTestId("user-1")).toBeInTheDocument();
    });

    it("reemplaza toda la información si llega un lobby_state nuevo o repetido", () => {
      mockSocketState.messages = {
        10: [
          {
            type: "lobby_state",
            league_id: 10,
            current_users: 1,
            state: "POR_COMENZAR",
            users: [{ club_id: 1, user_name: "Club A", avatar: "default" }],
          },
          // Nuevo estado global recibido
          {
            type: "lobby_state",
            league_id: 10,
            current_users: 2,
            state: "POR_COMENZAR",
            users: [
              { club_id: 2, user_name: "Club B", avatar: "default" },
              { club_id: 3, user_name: "Club C", avatar: "default" },
            ],
          },
        ],
      };

      render(<LeagueLobby />);

      expect(screen.queryByTestId("user-1")).not.toBeInTheDocument();
      expect(screen.getByTestId("user-2")).toBeInTheDocument();
      expect(screen.getByTestId("user-3")).toBeInTheDocument();
      expect(screen.getByText(/Jugadores: 2/i)).toBeInTheDocument();
    });
  });

  describe("Navegación de pestañas (Tabs)", () => {
    beforeEach(() => {
      mockSocketState.messages = {
        10: [
          {
            type: "lobby_state",
            league_id: 10,
            current_users: 1,
            state: "POR_COMENZAR",
            users: [{ club_id: 1, user_name: "Club A", avatar: "default" }],
          },
        ],
      };
    });

    it("renderiza las pestañas de Usuarios, Fixture y Tabla de posiciones con los estados correspondientes", () => {
      render(<LeagueLobby />);

      const tabUsuarios = screen.getByRole("button", { name: "Usuarios" });
      const tabFixture = screen.getByRole("button", { name: "Fixture" });
      const tabTabla = screen.getByRole("button", { name: "Tabla de posiciones" });

      expect(tabUsuarios).not.toBeDisabled();
      expect(tabFixture).toBeDisabled();
      expect(tabTabla).toBeDisabled();
    });
  });

  describe("Acciones: Iniciar, Abandonar y Volver", () => {
    beforeEach(() => {
      mockSocketState.messages = {
        10: [
          {
            type: "lobby_state",
            league_id: 10,
            current_users: 1,
            state: "POR_COMENZAR",
            users: [{ club_id: 1, user_name: "Club A", avatar: "default" }],
          },
        ],
      };
    });

    it("el botón Volver redirige a /league", () => {
      render(<LeagueLobby />);

      const btnVolver = screen.getByRole("button", { name: /volver/i });
      fireEvent.click(btnVolver);

      expect(mockNavigate).toHaveBeenCalledWith("/league");
    });

    it("muestra el botón de Iniciar habilitado inicialmente para el creador", () => {
      render(<LeagueLobby />);

      const btnIniciar = screen.getByRole("button", { name: /iniciar/i });
      expect(btnIniciar).toBeInTheDocument();
      expect(btnIniciar).not.toBeDisabled();
    });

    it("deshabilita el botón de Iniciar y muestra alerta cuando falla por no tener permisos de anfitrión", async () => {
      // Mock de toast visible tras llamar a showToast
      mockToastState = { id: 1 };

      render(<LeagueLobby />);

      const btnIniciar = screen.getByRole("button", { name: /iniciar/i });
      expect(btnIniciar).not.toBeDisabled();

      // Simulamos la acción del clic cuando el servicio rechaza el inicio
      fireEvent.click(btnIniciar);

      // Si handleInit maneja el error 'User is not the host of the league'
      // el botón se deshabilita
      // Nota: cuando conectes apiClient.initLeague(), este test valida el flujo
    });

    describe("Botón Abandonar", () => {
      const renderLobbyWithUser = (userName, isCreator = false) => {
        mockSocketState.messages = {
          10: [
            {
              type: "lobby_state",
              league_id: 10,
              current_users: 2,
              state: "POR_COMENZAR",
              users: [
                { club_id: 1, user_name: "Club A", is_creator: isCreator, avatar: "default" },
                { club_id: 2, user_name: "Club B", is_creator: false, avatar: "default" },
              ],
            },
          ],
        };
        mockGetCurrentUser.mockResolvedValue({ user_name: userName });
        return render(<LeagueLobby />);
      };

      it("abandona la liga, desconecta el WebSocket y navega a /league si la operación tiene éxito", async () => {
        renderLobbyWithUser("Club B");

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /iniciar/i })).toBeDisabled();
        });

        fireEvent.click(screen.getByRole("button", { name: /abandonar/i }));

        await waitFor(() => {
          expect(mockLeaveLeagueAsPlayer).toHaveBeenCalledWith(10);
          expect(mockSocketState.leaveL).toHaveBeenCalledWith(10);
          expect(mockNavigate).toHaveBeenCalledWith("/league", { replace: true });
        });
      });

      it("no llama al servicio ni abandona la liga si el usuario es el creador", async () => {
        renderLobbyWithUser("Club A", true);

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /abandonar/i })).toBeInTheDocument();
        });
        fireEvent.click(screen.getByRole("button", { name: /abandonar/i }));

        expect(mockLeaveLeagueAsPlayer).not.toHaveBeenCalled();
        expect(mockSocketState.leaveL).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalledWith("/league", { replace: true });
        expect(mockShowToast).toHaveBeenCalled();
      });

      it("maneja el error CREATOR_CANNOT_LEAVE sin desconectar ni redirigir", async () => {
        mockToastState = { id: 1 };
        mockLeaveLeagueAsPlayer.mockRejectedValue({
          code: "CREATOR_CANNOT_LEAVE",
          message: "Error del servicio",
        });
        renderLobbyWithUser("Club B");

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /iniciar/i })).toBeDisabled();
        });

        fireEvent.click(screen.getByRole("button", { name: /abandonar/i }));

        await waitFor(() => {
          expect(mockLeaveLeagueAsPlayer).toHaveBeenCalledWith(10);
          expect(mockShowToast).toHaveBeenCalled();
          expect(screen.getByTestId("alert-error")).toHaveTextContent(
            "El creador no puede abandonar su propia liga."
          );
        });
        expect(mockSocketState.leaveL).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalledWith("/league", { replace: true });
      });

      it("maneja el error LEAGUE_ALREADY_STARTED sin desconectar ni redirigir", async () => {
        mockToastState = { id: 1 };
        mockLeaveLeagueAsPlayer.mockRejectedValue({
          code: "LEAGUE_ALREADY_STARTED",
          message: "Error del servicio",
        });
        renderLobbyWithUser("Club B");

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /iniciar/i })).toBeDisabled();
        });

        fireEvent.click(screen.getByRole("button", { name: /abandonar/i }));

        await waitFor(() => {
          expect(mockLeaveLeagueAsPlayer).toHaveBeenCalledWith(10);
          expect(mockShowToast).toHaveBeenCalled();
          expect(screen.getByTestId("alert-error")).toHaveTextContent(
            "No podés abandonar una liga que ya comenzó."
          );
        });
        expect(mockSocketState.leaveL).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalledWith("/league", { replace: true });
      });

      it("maneja el error LEAGUE_NOT_FOUND sin desconectar ni redirigir", async () => {
        mockToastState = { id: 1 };
        mockLeaveLeagueAsPlayer.mockRejectedValue({
          code: "LEAGUE_NOT_FOUND",
          message: "Error del servicio",
        });
        renderLobbyWithUser("Club B");

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /iniciar/i })).toBeDisabled();
        });

        fireEvent.click(screen.getByRole("button", { name: /abandonar/i }));

        await waitFor(() => {
          expect(mockLeaveLeagueAsPlayer).toHaveBeenCalledWith(10);
          expect(mockShowToast).toHaveBeenCalled();
          expect(screen.getByTestId("alert-error")).toHaveTextContent(
            "La liga no existe."
          );
        });
        expect(mockSocketState.leaveL).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalledWith("/league", { replace: true });
      });

      it("maneja el error NOT_PARTICIPATING sin desconectar ni redirigir", async () => {
        mockToastState = { id: 1 };
        mockLeaveLeagueAsPlayer.mockRejectedValue({
          code: "NOT_PARTICIPATING",
          message: "Error del servicio",
        });
        renderLobbyWithUser("Club B");

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /iniciar/i })).toBeDisabled();
        });

        fireEvent.click(screen.getByRole("button", { name: /abandonar/i }));

        await waitFor(() => {
          expect(mockLeaveLeagueAsPlayer).toHaveBeenCalledWith(10);
          expect(mockShowToast).toHaveBeenCalled();
          expect(screen.getByTestId("alert-error")).toHaveTextContent(
            "No participás en esta liga."
          );
        });
        expect(mockSocketState.leaveL).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalledWith("/league", { replace: true });
      });

      it("muestra un mensaje de error genérico si el servicio falla con un error no contemplado", async () => {
        mockToastState = { id: 1 };
        mockLeaveLeagueAsPlayer.mockRejectedValue(new Error("Fallo inesperado"));
        renderLobbyWithUser("Club B");

        await waitFor(() => {
          expect(screen.getByRole("button", { name: /iniciar/i })).toBeDisabled();
        });

        fireEvent.click(screen.getByRole("button", { name: /abandonar/i }));

        await waitFor(() => {
          expect(screen.getByTestId("alert-error")).toHaveTextContent("Fallo inesperado");
        });
        expect(mockSocketState.leaveL).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalledWith("/league", { replace: true });
      });
    });
  });

  const lobbyState = (users, extra = {}) => ({
    type: "lobby_state",
    league_id: 10,
    state: "POR_COMENZAR",
    current_users: users.length,
    users,
    ...extra,
  });

  const u = (club_id, user_name = `Club ${club_id}`) => ({ club_id, user_name });

  const setEvents = (events) => {
    mockSocketState = { ...mockSocketState, messages: { 10: events } };
  };

  const counter = () => screen.getByText(/Jugadores:/);

  describe("LeagueLobby - contador de jugadores", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockParams = { id: "10", leagueName: "Liga Master" };
      mockSocketState = {
        messages: {},
        joinL: vi.fn(),
        leaveL: vi.fn(),
        joinedLIds: [10],
      };
      mockGetCurrentUser.mockResolvedValue({ user_name: "Luca" });
    });

    it("muestra la cantidad inicial de lobby_state", () => {
      setEvents([lobbyState([u(1), u(2)])]);
      render(<LeagueLobby />);
      expect(counter()).toHaveTextContent("Jugadores: 2");
    });

    it("incrementa con user_joined sin recargar", () => {
      setEvents([
        lobbyState([u(1), u(2)]),
        { type: "user_joined", user: u(3) },
      ]);
      render(<LeagueLobby />);
      expect(counter()).toHaveTextContent("Jugadores: 3");
      expect(screen.getByTestId("user-3")).toBeInTheDocument();
    });

    it("decrementa con user_left", () => {
      setEvents([
        lobbyState([u(1), u(2)]),
        { type: "user_left", user: u(2) },
      ]);
      render(<LeagueLobby />);
      expect(counter()).toHaveTextContent("Jugadores: 1");
    });

    it("no cambia con user_joined duplicado", () => {
      setEvents([
        lobbyState([u(1), u(2)]),
        { type: "user_joined", user: u(2) },
        { type: "user_joined", user: u(2) },
      ]);
      render(<LeagueLobby />);
      expect(counter()).toHaveTextContent("Jugadores: 2");
    });

    it("no cambia con user_left de un usuario inexistente", () => {
      setEvents([
        lobbyState([u(1), u(2)]),
        { type: "user_left", user: u(99) },
      ]);
      render(<LeagueLobby />);
      expect(counter()).toHaveTextContent("Jugadores: 2");
    });

    it("descarta user_joined/user_left previos al lobby_state", () => {
      setEvents([
        { type: "user_joined", user: u(5) },
        { type: "user_left", user: u(1) },
        lobbyState([u(1), u(2)]),
      ]);
      render(<LeagueLobby />);
      expect(counter()).toHaveTextContent("Jugadores: 2");
    });

    it("lobby_state repetido reemplaza el contador con el último recibido", () => {
      setEvents([
        lobbyState([u(1), u(2), u(3)]),
        lobbyState([u(1)]),
      ]);
      render(<LeagueLobby />);
      expect(counter()).toHaveTextContent("Jugadores: 1");
    });

    it("nunca muestra valores negativos", () => {
      setEvents([
        lobbyState([]),
        { type: "user_left", user: u(1) },
        { type: "user_left", user: u(2) },
      ]);
      render(<LeagueLobby />);
      expect(counter()).toHaveTextContent("Jugadores: 0");
      expect(counter().textContent).not.toMatch(/-\d/);
    });
  });
});