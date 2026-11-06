
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MatchPage } from "./MatchPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useParams } from "react-router-dom";

const mockUseWebSocket = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: () => vi.fn(),
  };
});

// Para último test
function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/matches/1"]}>
      <Routes>
        <Route path="/matches/:matchId" element={<MatchPage />} />
      </Routes>
    </MemoryRouter>
  );
}

vi.mock("../../shared/hooks.js", () => ({
  default: (...args) => mockUseWebSocket(...args),
}));

vi.mock("./useAnimatedMatchState.js", () => ({
  useAnimatedMatchState: (estado) => estado,
}));

vi.mock("./views/Match", () => ({
  Match: ({ estado_partido, matchId, matchInfo, pausa, ventanaSustitucionesAbierta }) => (
    <div
      data-testid="match"
      data-match-id={matchId}
      data-pause-type={pausa?.pause_type ?? ""}
      data-my-club-id={matchInfo?.my_club_id ?? ""}
      data-substitutions-open={String(ventanaSustitucionesAbierta)}
    >
      {estado_partido.actual_tic}/{estado_partido.total_tic}
      {" - "}
      {estado_partido.user1_goals}-{estado_partido.user2_goals}
    </div>
  ),
}));

describe("MatchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.stubEnv(
      "VITE_WS_SESSION_URL",
      "wss://test-server:8000"
    );

    useParams.mockReturnValue({
      matchId: "123",
    });
  });

  it("muestra mensaje de conexión mientras no recibe el estado del partido", () => {
    render(<MatchPage />);

    expect(
      screen.getByText("Conectando al partido...")
    ).toBeInTheDocument();
  });

  it("crea la conexión WebSocket con el matchId sin token en modo espectador", () => {
    render(<MatchPage />);

    expect(mockUseWebSocket).toHaveBeenCalledTimes(1);

    const [url] = mockUseWebSocket.mock.calls[0];

    expect(url).toBe(
      "wss://test-server:8000/ws/matches/123"
    );
  });

  it("crea la conexión WebSocket con el token cuando el usuario está autenticado", () => {
    localStorage.setItem("token", "mi-token-secreto");

    render(<MatchPage />);

    expect(mockUseWebSocket).toHaveBeenCalledTimes(1);

    const [url] = mockUseWebSocket.mock.calls[0];

    expect(url).toBe(
      "wss://test-server:8000/ws/matches/123?token=mi-token-secreto"
    );
  });

  it("recibe match_info y pasa los datos estáticos al componente Match", () => {
    render(<MatchPage />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage({
        event: "match_info",
        match_id: 123,
        my_club_id: 7,
        team_a: { club_id: 7, club_name: "Mi Club" },
        team_b: { club_id: 8, club_name: "Rival" },
        players: [],
      });
    });

    act(() => {
      options.onMessage({
        event: "estado_partido",
        actual_tic: 0,
        total_tic: 600,
        user1_goals: 0,
        user2_goals: 0,
        ball: { x: 20, y: 10, speed_x: 0, speed_y: 0 },
        players: [],
      });
    });

    expect(screen.getByTestId("match")).toHaveAttribute("data-my-club-id", "7");
  });

  it("recibe un estado y muestra el partido", () => {
    render(<MatchPage />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage({
        actual_tic: 25,
        total_tic: 600,
        user1_goals: 2,
        user2_goals: 1,
        ball: {
          x: 20,
          y: 10,
          speed_x: 1,
          speed_y: 0,
        },
        players: [],
      });
    });

    expect(
      screen.getByTestId("match")
    ).toHaveTextContent("25/600 - 2-1");

    expect(
      screen.getByTestId("match")
    ).toHaveAttribute("data-match-id", "123");
  });

  it("actualiza el partido cuando recibe un nuevo estado", () => {
    render(<MatchPage />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage({
        actual_tic: 10,
        total_tic: 600,
        user1_goals: 0,
        user2_goals: 0,
        ball: {
          x: 10,
          y: 10,
          speed_x: 1,
          speed_y: 0,
        },
        players: [],
      });
    });

    expect(
      screen.getByTestId("match")
    ).toHaveTextContent("10/600 - 0-0");

    act(() => {
      options.onMessage({
        actual_tic: 11,
        total_tic: 600,
        user1_goals: 1,
        user2_goals: 0,
        ball: {
          x: 11,
          y: 10,
          speed_x: 1,
          speed_y: 0,
        },
        players: [],
      });
    });

    expect(
      screen.getByTestId("match")
    ).toHaveTextContent("11/600 - 1-0");
  });

  it("no intenta conectarse si no hay matchId", () => {
    useParams.mockReturnValue({
      matchId: undefined,
    });

    render(<MatchPage />);

    const [url] = mockUseWebSocket.mock.calls[0];

    expect(url).toBeNull();
  });

  it("mantiene visible el último estado recibido cuando la conexión se cierra", () => {
    render(<MatchPage />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage({
        actual_tic: 50,
        total_tic: 600,
        user1_goals: 3,
        user2_goals: 2,
        ball: {
          x: 20,
          y: 10,
          speed_x: 0,
          speed_y: 0,
        },
        players: [],
      });
    });

    expect(
      screen.getByTestId("match")
    ).toHaveTextContent("50/600 - 3-2");

    act(() => {
      options.onClose({
        code: 1000,
        reason: "Partido finalizado",
      });
    });

    expect(
      screen.getByTestId("match")
    ).toHaveTextContent("50/600 - 3-2");
  });

  it("muestra un mensaje de error y el botón de salir si el partido no existe", () => {
    renderPage();

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onClose({ code: 4404, reason: "Match not found" });
    });

    expect(
      screen.getByRole("heading", { name: "El partido no existe" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Salir del partido" })
    ).toBeInTheDocument();
  });

  it("activa la pausa de hidratación cuando recibe pause_started", () => {
    render(<MatchPage />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage({
        actual_tic: 150,
        total_tic: 600,
        user1_goals: 1,
        user2_goals: 0,
        ball: {
          x: 20,
          y: 10,
          speed_x: 0,
          speed_y: 0,
        },
        players: [],
      });
    });

    act(() => {
      options.onMessage({
        event: "pause_started",
        pause_type: "hydration",
        duration: 10,
        planning_duration: 5,
      });
    });

    expect(screen.getByTestId("match"))
      .toHaveAttribute("data-pause-type", "hydration");
  });

  it("activa la pausa de entretiempo cuando recibe pause_started", () => {
    render(<MatchPage />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage({
        actual_tic: 300,
        total_tic: 600,
        user1_goals: 1,
        user2_goals: 1,
        ball: {
          x: 20,
          y: 10,
          speed_x: 0,
          speed_y: 0,
        },
        players: [],
      });
    });

    act(() => {
      options.onMessage({
        event: "pause_started",
        pause_type: "halftime",
        duration: 20,
        planning_duration: 15,
      });
    });

    expect(screen.getByTestId("match"))
      .toHaveAttribute("data-pause-type", "halftime");
  });

  it("desactiva la pausa cuando recibe pause_finished", () => {
    render(<MatchPage />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage({
        actual_tic: 150,
        total_tic: 600,
        user1_goals: 1,
        user2_goals: 0,
        ball: {
          x: 20,
          y: 10,
          speed_x: 0,
          speed_y: 0,
        },
        players: [],
      });
    });

    act(() => {
      options.onMessage({
        event: "pause_started",
        pause_type: "hydration",
        duration: 10,
        planning_duration: 5,
      });
    });

    expect(screen.getByTestId("match"))
      .toHaveAttribute("data-pause-type", "hydration");

    act(() => {
      options.onMessage({
        event: "pause_finished",
        pause_type: "hydration",
      });
    });

    expect(screen.getByTestId("match"))
      .toHaveAttribute("data-pause-type", "");
  });

  it("sigue actualizando el estado del partido durante una pausa", () => {
    render(<MatchPage />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage({
        actual_tic: 150,
        total_tic: 600,
        user1_goals: 1,
        user2_goals: 0,
        ball: {
          x: 20,
          y: 10,
          speed_x: 0,
          speed_y: 0,
        },
        players: [],
      });
    });

    act(() => {
      options.onMessage({
        event: "pause_started",
        pause_type: "hydration",
        duration: 10,
        planning_duration: 5,
      });
    });

    act(() => {
      options.onMessage({
        actual_tic: 150,
        total_tic: 600,
        user1_goals: 1,
        user2_goals: 0,
        ball: {
          x: 22,
          y: 10,
          speed_x: 0,
          speed_y: 0,
        },
        players: [],
      });
    });

    expect(screen.getByTestId("match"))
      .toHaveAttribute("data-pause-type", "hydration");

    expect(screen.getByTestId("match"))
      .toHaveTextContent("150/600 - 1-0");
  });

  it("abre la ventana de sustituciones en pause_started y la cierra en substitution_window_closed", () => {
    render(<MatchPage />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage({
        actual_tic: 150,
        total_tic: 600,
        user1_goals: 1,
        user2_goals: 0,
        ball: { x: 20, y: 10, speed_x: 0, speed_y: 0 },
        players: [],
      });
    });

    act(() => {
      options.onMessage({
        event: "pause_started",
        pause_type: "hydration",
        duration: 10,
        planning_duration: 5,
      });
    });

    expect(screen.getByTestId("match"))
      .toHaveAttribute("data-substitutions-open", "true");

    act(() => {
      options.onMessage({
        event: "substitution_window_closed",
        pause_type: "hydration",
      });
    });

    expect(screen.getByTestId("match"))
      .toHaveAttribute("data-substitutions-open", "false");
  });
});
