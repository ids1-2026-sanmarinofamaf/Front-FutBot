// features/match/MatchPage.test.jsxvi.mock
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MatchPage } from "./MatchPage";

const mockUseWebSocket = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: () => vi.fn(),
  };
});


vi.mock("../../shared/hooks.js", () => ({
  default: (...args) => mockUseWebSocket(...args),
}));

vi.mock("./useAnimatedMatchState.js", () => ({
  useAnimatedMatchState: (estado) => estado,
}));

vi.mock("./views/Match", () => ({
  Match: ({ estado_partido }) => (
    <div data-testid="match">
      {estado_partido.actual_tic}/{estado_partido.total_tic}
      {" - "}
      {estado_partido.user1_goals}-{estado_partido.user2_goals}
    </div>
  ),
}));

import { useParams } from "react-router-dom";

describe("MatchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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

  it("crea la conexión WebSocket con el matchId", () => {
    render(<MatchPage />);

    expect(mockUseWebSocket).toHaveBeenCalledTimes(1);

    const [url] = mockUseWebSocket.mock.calls[0];

    expect(url).toBe(
      "wss://test-server:8000/ws/matches/123"
    );
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

  it("muestra un mensaje de error si el partido no existe", () => {
    render(<MatchPage />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onClose({ code: 4404, reason: "Match not found" });
    });

    expect(
      screen.getByText("El partido no existe")
    ).toBeInTheDocument();
  });
});