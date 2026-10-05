import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FGCard } from "./FGCard"; // Ajusta la ruta si es necesario

// 1. Mocks de dependencias externas
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("../api", () => ({
  joinFGAsPlayer: vi.fn(),
}));

vi.mock("../FriendlyGamesProvider", () => ({
  useFriendlyGamesSocket: vi.fn(),
}));

vi.mock("../../../shared/hooks", () => ({
  useToast: vi.fn(() => ({
    toast: { id: 1 },
    showToast: vi.fn(),
    hideToast: vi.fn(),
  })),
}));

// Módulo falso para el componente de alerta (para evitar dependencias de UI complejas)
vi.mock("../../../shared/components/RightDownAlert", () => ({
  default: ({ errorDescription }) => <div data-testid="toast-alert">{errorDescription}</div>,
}));

// 2. Importación de módulos mockeados para aserciones
import { useNavigate } from "react-router-dom";
import { joinFGAsPlayer } from "../api";
import { useFriendlyGamesSocket } from "../FriendlyGamesProvider";
import { useToast } from "../../../shared/hooks";

describe("FGCard Component", () => {
  let mockNavigate;
  let mockJoinFG;

  const defaultGame = {
    friendly_game_id: 10,
    creator_club_name: "Test Club",
    current_participants: 1,
    capacity: 2,
    state: "POR_COMENZAR",
  };

  const validRoster = { players: [1, 2, 3, 4, 5, 6] };
  const invalidRoster = { players: [] };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);

    mockJoinFG = vi.fn();
    useFriendlyGamesSocket.mockReturnValue({
      joinFG: mockJoinFG,
      joinedFGIds: [],
    });
  });

  it("Renderiza correctamente los datos del partido", () => {
    render(<FGCard game={defaultGame} roster={validRoster} />);
    expect(screen.getByText(/Creador: Test Club/i)).toBeInTheDocument();
    expect(screen.getByText(/Jugadores actuales: 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByText(/estado: POR_COMENZAR/i)).toBeInTheDocument();
  });

  it("Deshabilita el botón 'Unirse' si no hay plantilla cargada", () => {
    render(<FGCard game={defaultGame} roster={invalidRoster} />);
    const button = screen.getByRole("button", { name: /Unirse/i });
    expect(button).toBeDisabled();
  });

  it("Navega directamente al lobby si el estado es JUGANDO (sin llamar a la API)", async () => {
    const playingGame = { ...defaultGame, state: "JUGANDO" };
    render(<FGCard game={playingGame} roster={invalidRoster} />);
    
    const button = screen.getByRole("button", { name: /Reconectar \/ Ver/i });
    expect(button).not.toBeDisabled();
    
    fireEvent.click(button);
    
    expect(joinFGAsPlayer).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/friendly/lobby/10");
  });

  it("Navega directamente si el usuario ya está unido (ID presente en el Provider)", () => {
    useFriendlyGamesSocket.mockReturnValue({
      joinFG: mockJoinFG,
      joinedFGIds: [10], // El ID coincide con el defaultGame
    });

    render(<FGCard game={defaultGame} roster={validRoster} />);
    
    const button = screen.getByRole("button", { name: /Entrar al lobby/i });
    fireEvent.click(button);
    
    expect(joinFGAsPlayer).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/friendly/lobby/10");
  });

  it("Realiza el POST exitoso y navega al unirse a un partido POR_COMENZAR", async () => {
    joinFGAsPlayer.mockResolvedValueOnce({});
    render(<FGCard game={defaultGame} roster={validRoster} />);
    
    const button = screen.getByRole("button", { name: /Unirse/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(joinFGAsPlayer).toHaveBeenCalledWith(10, validRoster);
      expect(mockJoinFG).toHaveBeenCalledWith(10);
      expect(mockNavigate).toHaveBeenCalledWith("/friendly/lobby/10");
    });
  });

  it("Navega al lobby si la API responde ALREADY_PARTICIPATING", async () => {
    const error = new Error("Already inside");
    error.code = "ALREADY_PARTICIPATING";
    joinFGAsPlayer.mockRejectedValueOnce(error);

    render(<FGCard game={defaultGame} roster={validRoster} />);
    fireEvent.click(screen.getByRole("button", { name: /Unirse/i }));

    await waitFor(() => {
      expect(mockJoinFG).toHaveBeenCalledWith(10);
      expect(mockNavigate).toHaveBeenCalledWith("/friendly/lobby/10");
    });
  });

  it("Muestra alerta si el partido está lleno (Error FULL)", async () => {
    const error = new Error("Game full");
    error.code = "FULL";
    joinFGAsPlayer.mockRejectedValueOnce(error);

    render(<FGCard game={defaultGame} roster={validRoster} />);
    fireEvent.click(screen.getByRole("button", { name: /Unirse/i }));

    await waitFor(() => {
      expect(screen.getByTestId("toast-alert")).toHaveTextContent("El partido amistoso está lleno");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it("Muestra alerta genérica ante cualquier otro error de la API", async () => {
    joinFGAsPlayer.mockRejectedValueOnce(new Error("Network Error"));

    render(<FGCard game={defaultGame} roster={validRoster} />);
    fireEvent.click(screen.getByRole("button", { name: /Unirse/i }));

    await waitFor(() => {
      expect(screen.getByTestId("toast-alert")).toHaveTextContent("Error al unirse, intente en otro momento.");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});