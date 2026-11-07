import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BehaviorPreview } from "./BehaviorPreview";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { stopBehaviorPreview } from "../api.js";

const mockUseWebSocket = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

vi.mock("../../../shared/hooks.js", () => ({
  default: (...args) => mockUseWebSocket(...args),
}));

vi.mock("../../match/useAnimatedMatchState.js", () => ({
  useAnimatedMatchState: (estado) => estado,
}));

vi.mock("../api.js", () => ({
  stopBehaviorPreview: vi.fn(),
}));

const sampleMatchState = {
  event: "estado_partido",
  actual_tic: 30,
  total_tic: 900,
  user1_goals: 1,
  user2_goals: 0,
  current_period: 1,
  ball: { x: 20, y: 10, speed_x: 0, speed_y: 0 },
  players: [
    { player_id: 1, x: 5, y: 5, team: "A", is_on_field: true, current_behavior_name: "Defender" },
    { player_id: 2, x: 10, y: 10, team: "A", is_on_field: true, current_behavior_name: null },
    { player_id: 3, x: 5, y: 15, team: "A", is_on_field: true, current_behavior_name: "Attacker" },
    { player_id: 4, x: 0, y: 0, team: "A", is_on_field: false, current_behavior_name: null },
    { player_id: 7, x: 35, y: 5, team: "B", is_on_field: true, current_behavior_name: "Defender" },
    { player_id: 8, x: 30, y: 10, team: "B", is_on_field: true, current_behavior_name: "Midfielder" },
    { player_id: 9, x: 35, y: 15, team: "B", is_on_field: true, current_behavior_name: "Attacker" },
  ],
};

describe("BehaviorPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.stubEnv("VITE_WS_SESSION_URL", "wss://test-server:8000");

    useParams.mockReturnValue({ previewId: "uuid-123" });
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({
      state: {
        returnPath: "/club/behaviors/new",
        draftName: "Mi Estrategia",
        draftCode: "def play():\n    return wait()",
      },
    });
  });

  it("muestra mensaje de preparación mientras no llega el primer estado", () => {
    render(<BehaviorPreview />);

    expect(screen.getByText("Preparando prueba...")).toBeInTheDocument();
  });

  it("conecta al WebSocket de previsualización con el token del usuario y reconnect en false", () => {
    localStorage.setItem("token", "token-jwt");

    render(<BehaviorPreview />);

    expect(mockUseWebSocket).toHaveBeenCalledTimes(1);
    const [url, options] = mockUseWebSocket.mock.calls[0];

    expect(url).toBe("wss://test-server:8000/ws/behaviors/previews/uuid-123?token=token-jwt");
    expect(options.reconnect).toBe(false);
  });

  it("renderiza los 6 titulares en cancha, resalta al jugador 2 con #62B5E5 y muestra las tarjetas laterales", () => {
    const { container } = render(<BehaviorPreview />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage(sampleMatchState);
    });

    // Tarjetas laterales de los 3 titulares propios y 3 rivales
    const card2 = screen.getByTestId("starter-card-2");
    expect(card2.querySelector("rect")).toHaveAttribute("fill", "#62B5E5");
    expect(screen.getByTestId("starter-behavior-2")).toHaveTextContent("En prueba");

    const card1 = screen.getByTestId("starter-card-1");
    expect(card1.querySelector("rect")).toHaveAttribute("fill", "blue");
    expect(screen.getByTestId("starter-behavior-1")).toHaveTextContent("Defender");

    const card7 = screen.getByTestId("starter-card-7");
    expect(card7.querySelector("rect")).toHaveAttribute("fill", "red");

    // No debe renderizar suplentes fuera de cancha (player_id = 4)
    expect(screen.queryByTestId("starter-card-4")).not.toBeInTheDocument();

    // Verifica que en la cancha hay un círculo pintado con #62B5E5
    const highlightedCircles = container.querySelectorAll('circle[fill="#62B5E5"]');
    expect(highlightedCircles).toHaveLength(1);
  });

  it("detiene la prueba llamando a stopBehaviorPreview y redirige conservando el borrador", async () => {
    stopBehaviorPreview.mockResolvedValue(null);

    render(<BehaviorPreview />);

    const [, options] = mockUseWebSocket.mock.calls[0];
    act(() => {
      options.onMessage(sampleMatchState);
    });

    const stopButton = screen.getByRole("button", { name: "Detener prueba" });
    fireEvent.click(stopButton);

    await waitFor(() => {
      expect(stopBehaviorPreview).toHaveBeenCalledWith("uuid-123");
      expect(mockNavigate).toHaveBeenCalledWith("/club/behaviors/new", {
        state: {
          draftName: "Mi Estrategia",
          draftCode: "def play():\n    return wait()",
        },
      });
    });
  });

  it("muestra el cartel de finalización cuando recibe preview_finished con reason completed y permite volver", () => {
    render(<BehaviorPreview />);

    const [, options] = mockUseWebSocket.mock.calls[0];

    act(() => {
      options.onMessage(sampleMatchState);
    });

    act(() => {
      options.onMessage({
        event: "preview_finished",
        reason: "completed",
      });
    });

    expect(
      screen.getByText("La prueba del comportamiento ha finalizado")
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Detener prueba" })
    ).not.toBeInTheDocument();

    const backButton = screen.getByRole("button", { name: "Volver" });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/club/behaviors/new", {
      state: {
        draftName: "Mi Estrategia",
        draftCode: "def play():\n    return wait()",
      },
    });
  });
});
