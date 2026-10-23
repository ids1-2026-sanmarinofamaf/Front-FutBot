import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BehaviorDetail } from "./BehaviorDetail";

// 1. Mocks de dependencias externas
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

vi.mock("../api", () => ({
  // getBehaviorById: vi.fn(),
  getBehaviors: vi.fn(),
}));

vi.mock("@monaco-editor/react", () => ({
  default: ({ value }) => <pre data-testid="code-editor">{value}</pre>,
}));

// 2. Importación de módulos mockeados
import { useParams, useNavigate, useLocation } from "react-router-dom";
// import { getBehaviorById } from "../api";
import { getBehaviors } from "../api";

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
    useLocation.mockReturnValue({ state: null });
  });

  it("Renderiza inmediatamente sin llamar a la API si recibe el comportamiento por location.state", () => {
    useLocation.mockReturnValue({ state: { behavior: mockBehaviorData } });

    render(<BehaviorDetail />);

    expect(screen.getByText("Presión Alta")).toBeInTheDocument();
    expect(screen.getByText(/def apply_pressure/)).toBeInTheDocument();
    expect(screen.queryByText(/Cargando código del comportamiento.../i)).not.toBeInTheDocument();
    expect(getBehaviors).not.toHaveBeenCalled();
  });

  it("Muestra el estado de carga al inicializar el componente sin state", () => {
    // Retorna una promesa pendiente para mantener el estado de carga
    // getBehaviorById.mockImplementationOnce(() => new Promise(() => {}));
    getBehaviors.mockImplementationOnce(() => new Promise(() => {}));
    
    render(<BehaviorDetail />);
    
    expect(screen.getByText(/Cargando código del comportamiento.../i)).toBeInTheDocument();
  });

  it("Renderiza el nombre y el código del comportamiento tras una respuesta exitosa del fallback", async () => {
    // getBehaviorById.mockResolvedValueOnce(mockBehaviorData);
    getBehaviors.mockResolvedValueOnce([mockBehaviorData]);
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(screen.getByText("Presión Alta")).toBeInTheDocument();
    });
    
    expect(screen.getByText(/def apply_pressure/)).toBeInTheDocument();
    expect(screen.queryByText(/Cargando código del comportamiento.../i)).not.toBeInTheDocument();
  });

  it("Llama a getBehaviors como fallback cuando no hay location.state", async () => {
    // getBehaviorById.mockResolvedValueOnce(mockBehaviorData);
    getBehaviors.mockResolvedValueOnce([mockBehaviorData]);
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      // expect(getBehaviorById).toHaveBeenCalledWith(mockBehaviorId);
      expect(getBehaviors).toHaveBeenCalledTimes(1);
    });
  });

  it("Muestra error cuando el comportamiento no se encuentra en la lista devuelta por getBehaviors", async () => {
    getBehaviors.mockResolvedValueOnce([{ behavior_id: "99", name: "Otro", code: "pass" }]);

    render(<BehaviorDetail />);

    await waitFor(() => {
      expect(screen.getByText("Comportamiento no encontrado.")).toBeInTheDocument();
    });
  });

  it("Muestra el mensaje de error específico si la API falla", async () => {
    const errorMessage = "Recurso no encontrado";
    // getBehaviorById.mockRejectedValueOnce(new Error(errorMessage));
    getBehaviors.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    expect(screen.queryByText(/Cargando código del comportamiento.../i)).not.toBeInTheDocument();
  });

  it("Muestra el mensaje de error genérico si la excepción no posee atributo message", async () => {
    // getBehaviorById.mockRejectedValueOnce({});
    getBehaviors.mockRejectedValueOnce({});
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(screen.getByText("Error de comunicación con el servidor.")).toBeInTheDocument();
    });
  });

  it("Navega hacia atrás (/club/behaviors) al hacer clic en 'Volver' desde la vista principal", async () => {
    // getBehaviorById.mockResolvedValueOnce(mockBehaviorData);
    getBehaviors.mockResolvedValueOnce([mockBehaviorData]);
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(screen.getByText("Presión Alta")).toBeInTheDocument();
    });
    
    const backButton = screen.getByRole("button", { name: /Volver/i });
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/club/behaviors");
  });

  it("Navega hacia atrás (/club/behaviors) al hacer clic en 'Volver' desde la vista de error", async () => {
    // getBehaviorById.mockRejectedValueOnce(new Error("Fallo de conexión"));
    getBehaviors.mockRejectedValueOnce(new Error("Fallo de conexión"));
    
    render(<BehaviorDetail />);
    
    await waitFor(() => {
      expect(screen.getByText("Fallo de conexión")).toBeInTheDocument();
    });
    
    const backButton = screen.getByRole("button", { name: /Volver/i });
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/club/behaviors");
  });
});