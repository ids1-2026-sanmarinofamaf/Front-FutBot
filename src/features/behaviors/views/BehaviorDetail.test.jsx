import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BehaviorDetail } from "./BehaviorDetail";

// 1. Mocks de dependencias externas
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock("../api", () => ({
  getBehaviorById: vi.fn(),
}));

// 2. Importación de módulos mockeados
import { useParams, useNavigate } from "react-router-dom";
import { getBehaviorById } from "../api";

describe("BehaviorDetail Component", () => {
  let mockNavigate;
  const mockBehaviorId = "42";

  const mockBehaviorData = {
    behavior_id: mockBehaviorId,
    name: "Presión Alta",
    code: "def apply_pressure(team, ball):\n    team.move_towards(ball.position)",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: mockBehaviorId });
  });

  it("Muestra el estado de carga al inicializar el componente", () => {
    // Retorna una promesa pendiente para mantener el estado de carga
    getBehaviorById.mockImplementationOnce(() => new Promise(() => {}));
    
    render(<BehaviorDetail />);
    
    expect(screen.getByText(/Cargando código del comportamiento.../i)).toBeInTheDocument();
  });

  it("Renderiza el nombre y el código del comportamiento tras una respuesta exitosa", async () => {
    getBehaviorById.mockResolvedValueOnce(mockBehaviorData);
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(screen.getByText("Presión Alta")).toBeInTheDocument();
    });
    
    expect(screen.getByText(/def apply_pressure/)).toBeInTheDocument();
    expect(screen.queryByText(/Cargando código del comportamiento.../i)).not.toBeInTheDocument();
  });

  it("Llama a la API con el ID extraído de la URL", async () => {
    getBehaviorById.mockResolvedValueOnce(mockBehaviorData);
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(getBehaviorById).toHaveBeenCalledWith(mockBehaviorId);
    });
  });

  it("Muestra el mensaje de error específico si la API falla", async () => {
    const errorMessage = "Recurso no encontrado";
    getBehaviorById.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    expect(screen.queryByText(/Cargando código del comportamiento.../i)).not.toBeInTheDocument();
  });

  it("Muestra el mensaje de error genérico si la excepción no posee atributo message", async () => {
    getBehaviorById.mockRejectedValueOnce({});
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(screen.getByText("Error de comunicación con el servidor.")).toBeInTheDocument();
    });
  });

  it("Navega hacia atrás (/club/behaviors) al hacer clic en 'Volver' desde la vista principal", async () => {
    getBehaviorById.mockResolvedValueOnce(mockBehaviorData);
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(screen.getByText("Presión Alta")).toBeInTheDocument();
    });
    
    const backButton = screen.getByRole("button", { name: /Volver/i });
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/club/behaviors");
  });

  it("Navega hacia atrás (/club/behaviors) al hacer clic en 'Volver' desde la vista de error", async () => {
    getBehaviorById.mockRejectedValueOnce(new Error("Fallo de conexión"));
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(screen.getByText("Fallo de conexión")).toBeInTheDocument();
    });
    
    const backButton = screen.getByRole("button", { name: /Volver/i });
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/club/behaviors");
  });
});