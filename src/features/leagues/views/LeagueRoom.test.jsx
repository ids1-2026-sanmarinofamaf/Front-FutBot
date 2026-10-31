import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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

const mockGetUserSessionInfo = vi.fn();
const mockStartLeague = vi.fn();

vi.mock("../api", () => ({
  getUserSessionInfo: () => mockGetUserSessionInfo(),
  startLeague: (...args) => mockStartLeague(...args),
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

// --- Datos y helpers ---

const mockFixture = [
  {
    match_id: 1,
    round: 1,
    state: "POR_COMENZAR",
    home_club: { club_id: 1, club_name: "Club A" },
    away_club: { club_id: 2, club_name: "Club B" },
  },
];

const mockStandings = [1, 2].map((club_id) => ({
  club_id,
  club_name: `Club ${club_id}`,
  points: 0,
  etc:"payload no definido a la hora de hacer este test"
}));

const u = (club_id, extra = {}) => ({
  club_id,
  user_name: `Club ${club_id}`,
  avatar: "default",
  ...extra,
});

const lobbyState = (users, state = "POR_COMENZAR") => ({
  type: "lobby_state",
  league_id: 10,
  state,
  current_users: users.length,
  users,
});

// Lobby con n integrantes donde el club 1 es el creador
const lobbyConCreador = (n, state) =>
  lobbyState(
    Array.from({ length: n }, (_, i) => u(i + 1, i === 0 ? { is_creator: true } : {})),
    state
  );

const leagueStarted = () => ({
  type: "league_started",
  league_id: 10,
  fixture: mockFixture,
  standings: mockStandings,
});

const setEvents = (events) => {
  mockSocketState = { ...mockSocketState, messages: { 10: events } };
};

const comoCreador = () => mockGetUserSessionInfo.mockResolvedValue({ user_id: 1 });
const comoParticipante = () => mockGetUserSessionInfo.mockResolvedValue({ user_id: 2 });

// Renderiza y deja resolver las promesas pendientes (getUserSessionInfo, etc.)
const renderLobby = async () => {
  const view = render(<LeagueLobby />);
  await act(async () => {});
  return view;
};

const btnIniciar = () => screen.queryByRole("button", { name: /iniciar liga/i });
const btnIniciando = () => screen.queryByRole("button", { name: /iniciando/i });
const tab = (name) => screen.getByRole("button", { name });
const counter = () => screen.getByText(/Jugadores:/);

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
    mockGetUserSessionInfo.mockResolvedValue({
      user_id: 1,
      user_name: "Club A",
      user_email: "club_a@test.com",
    });
    mockStartLeague.mockResolvedValue();
  });

  describe("Control de acceso temprano y conexión", () => {
    it("redirige de inmediato a /league si el usuario ingresó por URL directa (no está en joinedLIds)", () => {
      mockSocketState.joinedLIds = [];

      render(<LeagueLobby />);

      expect(mockNavigate).toHaveBeenCalledWith("/league", { replace: true });
      expect(mockSocketState.joinL).not.toHaveBeenCalled();
    });

    it("conecta al WebSocket llamando a joinL con el ID numérico si el acceso es válido", async () => {
      render(<LeagueLobby />);

      expect(mockSocketState.joinL).toHaveBeenCalledWith(10);
      await waitFor(() => {
        expect(mockGetCurrentUser).toHaveBeenCalled();
      });
    });
  });

  describe("Estado de carga inicial y desbloqueo con lobby_state", () => {
    it("muestra pantalla de espera si no se ha recibido lobby_state", () => {
      setEvents([]);

      render(<LeagueLobby />);

      expect(screen.getByText(/Esperando estado del servidor/i)).toBeInTheDocument();
      expect(screen.queryByTestId("lobby-users")).not.toBeInTheDocument();
    });

    it("desbloquea la UI al recibir lobby_state y muestra la información inicial de la liga", () => {
      setEvents([lobbyState([u(1), u(2)])]);

      render(<LeagueLobby />);

      expect(screen.queryByText(/Esperando estado del servidor/i)).not.toBeInTheDocument();
      expect(screen.getByText("Liga Master")).toBeInTheDocument();
      expect(counter()).toHaveTextContent("Jugadores: 2");
      expect(screen.getByTestId("user-1")).toHaveTextContent("Club 1");
      expect(screen.getByTestId("user-2")).toHaveTextContent("Club 2");
    });
  });

  describe("Gestión y orden de eventos WebSocket", () => {
    it("descarta user_joined / user_left si llegan antes del lobby_state inicial", () => {
      setEvents([
        { type: "user_joined", user: u(99) },
        { type: "user_left", user: u(99) },
      ]);

      render(<LeagueLobby />);

      expect(screen.getByText(/Esperando estado del servidor/i)).toBeInTheDocument();
      expect(screen.queryByTestId("user-99")).not.toBeInTheDocument();
    });

    it("agrega un participante cuando llega user_joined", () => {
      setEvents([lobbyState([u(1)]), { type: "user_joined", user: u(2) }]);

      render(<LeagueLobby />);

      expect(screen.getByTestId("user-1")).toBeInTheDocument();
      expect(screen.getByTestId("user-2")).toBeInTheDocument();
    });

    it("ignora user_joined duplicado", () => {
      setEvents([lobbyState([u(1)]), { type: "user_joined", user: u(1) }]);

      render(<LeagueLobby />);

      expect(screen.getAllByTestId("user-1")).toHaveLength(1);
    });

    it("elimina al participante cuando llega user_left", () => {
      setEvents([lobbyState([u(1), u(2)]), { type: "user_left", user: u(1) }]);

      render(<LeagueLobby />);

      expect(screen.queryByTestId("user-1")).not.toBeInTheDocument();
      expect(screen.getByTestId("user-2")).toBeInTheDocument();
    });

    it("no modifica la lista si llega user_left de un usuario que no participaba", () => {
      setEvents([lobbyState([u(1)]), { type: "user_left", user: u(999) }]);

      render(<LeagueLobby />);

      expect(screen.getByTestId("user-1")).toBeInTheDocument();
    });

    it("reemplaza toda la información si llega un lobby_state nuevo o repetido", () => {
      setEvents([lobbyState([u(1)]), lobbyState([u(2), u(3)])]);

      render(<LeagueLobby />);

      expect(screen.queryByTestId("user-1")).not.toBeInTheDocument();
      expect(screen.getByTestId("user-2")).toBeInTheDocument();
      expect(screen.getByTestId("user-3")).toBeInTheDocument();
      expect(counter()).toHaveTextContent("Jugadores: 2");
    });

    describe("evento league_started", () => {
      it("descarta league_started si llega antes del lobby_state inicial", () => {
        setEvents([leagueStarted()]);

        render(<LeagueLobby />);

        expect(screen.getByText(/Esperando estado del servidor/i)).toBeInTheDocument();
        expect(screen.queryByTestId("lobby-users")).not.toBeInTheDocument();
      });

      it("procesa league_started luego de lobby_state preservando los datos del lobby", () => {
        setEvents([lobbyState([u(1), u(2)]), leagueStarted()]);

        render(<LeagueLobby />);

        expect(screen.queryByText(/Esperando estado del servidor/i)).not.toBeInTheDocument();
        expect(screen.getByText("Liga Master")).toBeInTheDocument();
        expect(counter()).toHaveTextContent("Jugadores: 2");
        expect(screen.getByTestId("user-1")).toBeInTheDocument();
        expect(screen.getByTestId("user-2")).toBeInTheDocument();
      });
    });
  });

  describe("Contador de jugadores", () => {
    it("muestra la cantidad inicial de lobby_state", () => {
      setEvents([lobbyState([u(1), u(2)])]);
      render(<LeagueLobby />);
      expect(counter()).toHaveTextContent("Jugadores: 2");
    });

    it("incrementa con user_joined sin recargar", () => {
      setEvents([lobbyState([u(1), u(2)]), { type: "user_joined", user: u(3) }]);
      render(<LeagueLobby />);
      expect(counter()).toHaveTextContent("Jugadores: 3");
      expect(screen.getByTestId("user-3")).toBeInTheDocument();
    });

    it("decrementa con user_left", () => {
      setEvents([lobbyState([u(1), u(2)]), { type: "user_left", user: u(2) }]);
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
      setEvents([lobbyState([u(1), u(2)]), { type: "user_left", user: u(99) }]);
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
      setEvents([lobbyState([u(1), u(2), u(3)]), lobbyState([u(1)])]);
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

  describe("Pestañas (Tabs)", () => {
    it("con la liga POR_COMENZAR, Usuarios está habilitada y Fixture y Tabla bloqueadas", () => {
      setEvents([lobbyConCreador(3)]);

      render(<LeagueLobby />);

      expect(tab("Usuarios")).not.toBeDisabled();
      expect(tab("Fixture")).toBeDisabled();
      expect(tab("Tabla de posiciones")).toBeDisabled();
    });

    it("se desbloquean en vivo al llegar league_started", () => {
      setEvents([lobbyConCreador(3)]);
      const { rerender } = render(<LeagueLobby />);
      expect(tab("Fixture")).toBeDisabled();

      setEvents([lobbyConCreador(3), leagueStarted()]);
      rerender(<LeagueLobby />);

      expect(tab("Fixture")).not.toBeDisabled();
      expect(tab("Tabla de posiciones")).not.toBeDisabled();
    });

    it("se desbloquean también para un participante que no es el creador", async () => {
      comoParticipante();
      setEvents([lobbyConCreador(3)]);
      const { rerender } = await renderLobby();
      expect(tab("Fixture")).toBeDisabled();

      setEvents([lobbyConCreador(3), leagueStarted()]);
      rerender(<LeagueLobby />);

      expect(tab("Fixture")).not.toBeDisabled();
      expect(tab("Tabla de posiciones")).not.toBeDisabled();
    });
  });

  describe("Identificación del creador", () => {
    beforeEach(() => {
      setEvents([lobbyConCreador(3)]);
    });

    it("llama a getUserSessionInfo para obtener el id del usuario autenticado (GET /users/me)", async () => {
      render(<LeagueLobby />);

      await waitFor(() => {
        expect(mockGetUserSessionInfo).toHaveBeenCalledTimes(1);
      });
    });

    it("si user_id coincide con el club_id con is_creator: true muestra el botón Iniciar liga", async () => {
      comoCreador();

      render(<LeagueLobby />);

      expect(await screen.findByRole("button", { name: /iniciar liga/i })).toBeInTheDocument();
      expect(screen.queryByText(/Esperando que el creador inicie la liga/i)).not.toBeInTheDocument();
    });

    it("si el usuario NO es el creador oculta el botón y muestra 'Esperando que el creador inicie la liga'", async () => {
      comoParticipante();

      render(<LeagueLobby />);

      expect(await screen.findByText(/Esperando que el creador inicie la liga/i)).toBeInTheDocument();
      expect(btnIniciar()).not.toBeInTheDocument();
    });

    it("compara los IDs de forma numérica aunque uno sea string", async () => {
      mockGetUserSessionInfo.mockResolvedValue({ user_id: "42", user_name: "Club 42" });
      setEvents([lobbyState([u(42, { is_creator: true }), u(2), u(3)])]);

      render(<LeagueLobby />);

      expect(await screen.findByRole("button", { name: /iniciar liga/i })).toBeInTheDocument();
    });

    it("no reconoce creador si ningún usuario tiene is_creator: true", async () => {
      setEvents([lobbyState([u(1, { is_creator: false }), u(2), u(3)])]);

      render(<LeagueLobby />);

      expect(await screen.findByText(/Esperando que el creador inicie la liga/i)).toBeInTheDocument();
      expect(btnIniciar()).not.toBeInTheDocument();
    });

    it("si falla getUserSessionInfo llama a showToast y oculta el botón Iniciar liga", async () => {
      mockGetUserSessionInfo.mockRejectedValue(new Error("Error al obtener datos de sesión."));

      render(<LeagueLobby />);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalled();
      });
      expect(screen.getByText(/Esperando que el creador inicie la liga/i)).toBeInTheDocument();
      expect(btnIniciar()).not.toBeInTheDocument();
    });
  });

  describe("Validaciones locales del botón Iniciar liga", () => {
    it("con menos de 3 integrantes el botón está deshabilitado y se muestra el aviso", async () => {
      setEvents([lobbyConCreador(2)]);

      await renderLobby();

      expect(btnIniciar()).toBeDisabled();
      expect(screen.getByText("Se necesitan al menos 3 integrantes")).toBeInTheDocument();
    });

    it("con 3 o más integrantes el botón está habilitado y no se muestra el aviso", async () => {
      setEvents([lobbyConCreador(3)]);

      await renderLobby();

      expect(btnIniciar()).not.toBeDisabled();
      expect(screen.queryByText("Se necesitan al menos 3 integrantes")).not.toBeInTheDocument();
    });

    it("se habilita en tiempo real al llegar user_joined completando 3 participantes", async () => {
      setEvents([lobbyConCreador(2)]);
      const { rerender } = await renderLobby();
      expect(btnIniciar()).toBeDisabled();

      setEvents([lobbyConCreador(2), { type: "user_joined", user: u(3) }]);
      rerender(<LeagueLobby />);

      expect(btnIniciar()).not.toBeDisabled();
      expect(screen.queryByText("Se necesitan al menos 3 integrantes")).not.toBeInTheDocument();
    });

    it("se deshabilita en tiempo real al llegar user_left dejando menos de 3 participantes", async () => {
      setEvents([lobbyConCreador(3)]);
      const { rerender } = await renderLobby();
      expect(btnIniciar()).not.toBeDisabled();

      setEvents([lobbyConCreador(3), { type: "user_left", user: u(3) }]);
      rerender(<LeagueLobby />);

      expect(btnIniciar()).toBeDisabled();
      expect(screen.getByText("Se necesitan al menos 3 integrantes")).toBeInTheDocument();
    });

    it("un participante no creador no ve el botón ni el aviso de mínimo de integrantes", async () => {
      comoParticipante();
      setEvents([lobbyConCreador(2)]);

      await renderLobby();

      expect(screen.getByText(/Esperando que el creador inicie la liga/i)).toBeInTheDocument();
      expect(btnIniciar()).not.toBeInTheDocument();
      expect(screen.queryByText("Se necesitan al menos 3 integrantes")).not.toBeInTheDocument();
    });
  });

  describe("Inicio de liga", () => {
    beforeEach(() => {
      setEvents([lobbyConCreador(3)]);
    });

    it("al hacer click llama a startLeague con el ID numérico de la liga", async () => {
      await renderLobby();

      fireEvent.click(btnIniciar());

      await waitFor(() => {
        expect(mockStartLeague).toHaveBeenCalledWith(10);
      });
      expect(mockStartLeague).toHaveBeenCalledTimes(1);
    });

    it("no llama a startLeague si el botón está deshabilitado por tener menos de 3 integrantes", async () => {
      setEvents([lobbyConCreador(2)]);
      await renderLobby();

      fireEvent.click(btnIniciar());

      expect(mockStartLeague).not.toHaveBeenCalled();
    });

    it("mientras espera la respuesta muestra 'Iniciando...' y deshabilita el botón", async () => {
      mockStartLeague.mockReturnValue(new Promise(() => {})); // nunca resuelve
      await renderLobby();

      fireEvent.click(btnIniciar());

      expect(btnIniciando()).toBeInTheDocument();
      expect(btnIniciando()).toBeDisabled();
      expect(btnIniciar()).not.toBeInTheDocument();
    });

    it("si el PATCH sale bien sigue en 'Iniciando...' hasta recibir league_started", async () => {
      const { rerender } = await renderLobby();

      fireEvent.click(btnIniciar());
      await waitFor(() => {
        expect(mockStartLeague).toHaveBeenCalled();
      });
      await act(async () => {}); // deja resolver el await del PATCH

      expect(btnIniciando()).toBeDisabled();

      setEvents([lobbyConCreador(3), leagueStarted()]);
      rerender(<LeagueLobby />);

      expect(btnIniciando()).not.toBeInTheDocument();
      expect(btnIniciar()).not.toBeInTheDocument();
    });
  });

  describe("Errores del PATCH de inicio", () => {
    beforeEach(() => {
      mockToastState = { id: 1 };
      setEvents([lobbyConCreador(3)]);
    });

    it.each([
      ["Only the league creator can start the league", "No eres el creador."],
      ["League does not exist", "La liga no existe."],
      ["League cannot be started", "La liga ya estaba iniciada."],
      ["Invalid state transition", "La liga no estaba en estado de comenzar."],
      ["League does not have enough participants", "Se necesitan tres participantes para iniciar."],
      ["cualquier otro detail", "Error desconocido."],
    ])("detail '%s' muestra '%s' y el botón vuelve a habilitarse", async (detail, mensaje) => {
      mockStartLeague.mockRejectedValue({ detail });
      await renderLobby();

      fireEvent.click(btnIniciar());

      const alerta = await screen.findByTestId("alert-error");
      expect(alerta).toHaveTextContent("No pudiste iniciar la liga");
      expect(alerta).toHaveTextContent(mensaje);
      expect(mockShowToast).toHaveBeenCalled();

      await waitFor(() => {
        expect(btnIniciar()).not.toBeDisabled();
      });
      expect(btnIniciando()).not.toBeInTheDocument();
    });

    it("un error sin detail (ej. caída de red) muestra 'Error desconocido.' y reactiva el botón", async () => {
      mockStartLeague.mockRejectedValue(new Error("Network Error"));
      await renderLobby();

      fireEvent.click(btnIniciar());

      expect(await screen.findByTestId("alert-error")).toHaveTextContent("Error desconocido.");
      await waitFor(() => {
        expect(btnIniciar()).not.toBeDisabled();
      });
    });

    it("tras un error se puede reintentar el inicio", async () => {
      mockStartLeague.mockRejectedValueOnce({ detail: "League does not exist" });
      await renderLobby();

      fireEvent.click(btnIniciar());
      await waitFor(() => {
        expect(btnIniciar()).not.toBeDisabled();
      });
      fireEvent.click(btnIniciar());

      await waitFor(() => {
        expect(mockStartLeague).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Liga ya iniciada o finalizada", () => {
    it("al llegar league_started en vivo desaparece el botón de iniciar", async () => {
      setEvents([lobbyConCreador(3)]);
      const { rerender } = await renderLobby();
      expect(btnIniciar()).toBeInTheDocument();

      setEvents([lobbyConCreador(3), leagueStarted()]);
      rerender(<LeagueLobby />);

      expect(btnIniciar()).not.toBeInTheDocument();
    });

    it("entrada tardía: lobby_state seguido de league_started deja la liga iniciada con tabs desbloqueados y sin botón", async () => {
      setEvents([lobbyConCreador(3), leagueStarted()]);

      await renderLobby();

      expect(btnIniciar()).not.toBeInTheDocument();
      expect(tab("Fixture")).not.toBeDisabled();
      expect(tab("Tabla de posiciones")).not.toBeDisabled();
    });

    // it("lobby_state FINALIZADA: sin botón de iniciar y con Fixture y Tabla desbloqueados", async () => {
    //   setEvents([lobbyConCreador(3, "FINALIZADA")]);

    //   await renderLobby();

    //   expect(btnIniciar()).not.toBeInTheDocument();
    //   expect(tab("Fixture")).not.toBeDisabled();
    //   expect(tab("Tabla de posiciones")).not.toBeDisabled();
    // });

    it.each(["INICIADA", "FINALIZADA"])(
      "con la liga %s no se muestra 'Esperando que el creador inicie la liga'",
      async (state) => {
        setEvents([lobbyConCreador(3, state)]);

        await renderLobby();

        expect(screen.queryByText(/Esperando que el creador inicie la liga/i)).not.toBeInTheDocument();
      }
    );
  });

  describe("Botón Volver", () => {
    it("redirige a /league", () => {
      setEvents([lobbyConCreador(3)]);

      render(<LeagueLobby />);
      fireEvent.click(screen.getByRole("button", { name: /volver/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/league");
    });
  });
});