import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BehaviorList } from "./BehaviorList"; // Ajusta la ruta si es necesario

// 1. Mocks de dependencias externas
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("../api", () => ({
  getBehaviors: vi.fn(),
}));

// Mock del subcomponente para aislar la prueba y facilitar la interacción con onView
vi.mock("../components/BehaviorCard", () => ({
  BehaviorCard: ({ behavior, onView }) => (
    <div data-testid={`behavior-card-${behavior.behavior_id}`}>
      <span>{behavior.name}</span>
      <button 
        onClick={() => onView(behavior.behavior_id)}
        data-testid={`view-btn-${behavior.behavior_id}`}
      >
        Ver
      </button>
    </div>
  ),
}));

// 2. Importación de módulos mockeados para aserciones
import { useNavigate } from "react-router-dom";
import { getBehaviors } from "../api";

describe("BehaviorList Component", () => {
  let mockNavigate;

  const mockBehaviors = [
    { behavior_id: 1, name: "Presión Alta" },
    { behavior_id: 2, name: "Defensa Retrasada" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);
  });

  it("Muestra el estado de carga inicialmente", () => {
    // Retrasamos la resolución para poder capturar el estado 'loading'
    getBehaviors.mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 100)));
    
    render(<BehaviorList />);
    
    expect(screen.getByText(/Cargando comportamientos.../i)).toBeInTheDocument();
  });

  it("Muestra el mensaje de lista vacía cuando la API devuelve un array vacío", async () => {
    getBehaviors.mockResolvedValueOnce([]);
    
    render(<BehaviorList />);
    
    await waitFor(() => {
      expect(screen.getByText(/El club no tiene comportamientos creados actualmente/i)).toBeInTheDocument();
    });
    // Verifica que la carga haya desaparecido
    expect(screen.queryByText(/Cargando comportamientos.../i)).not.toBeInTheDocument();
  });

  it("Renderiza la lista de comportamientos correctamente", async () => {
    getBehaviors.mockResolvedValueOnce(mockBehaviors);
    
    render(<BehaviorList />);
    
    await waitFor(() => {
      expect(screen.getByTestId("behavior-card-1")).toBeInTheDocument();
      expect(screen.getByTestId("behavior-card-2")).toBeInTheDocument();
    });
    
    expect(screen.getByText("Presión Alta")).toBeInTheDocument();
    expect(screen.getByText("Defensa Retrasada")).toBeInTheDocument();
  });

  it("Muestra un mensaje de error si la llamada a la API falla", async () => {
    const errorMessage = "Error interno del servidor";
    getBehaviors.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<BehaviorList />);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("Muestra error genérico si la API falla sin un mensaje específico", async () => {
    getBehaviors.mockRejectedValueOnce({});
    
    render(<BehaviorList />);
    
    await waitFor(() => {
      expect(screen.getByText(/Fallo en la comunicación con el servidor al obtener los comportamientos/i)).toBeInTheDocument();
    });
  });

  it("Navega hacia atrás (/club) al hacer clic en el botón de volver", async () => {
    getBehaviors.mockResolvedValueOnce([]);
    
    render(<BehaviorList />);
    
    // Esperamos a que pase el loading
    await waitFor(() => {
      expect(screen.getByText(/Volver a Mi Club/i)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText(/Volver a Mi Club/i));
    
    expect(mockNavigate).toHaveBeenCalledWith("/club");
  });

  it("Navega a los detalles del comportamiento al desencadenar onView en la tarjeta", async () => {
    getBehaviors.mockResolvedValueOnce(mockBehaviors);
    
    render(<BehaviorList />);
    
    // Esperamos a que se rendericen las tarjetas
    await waitFor(() => {
      expect(screen.getByTestId("view-btn-1")).toBeInTheDocument();
    });
    
    // Simulamos el click que el BehaviorCard haría internamente
    fireEvent.click(screen.getByTestId("view-btn-1"));
    
    expect(mockNavigate).toHaveBeenCalledWith("/club/behaviors/1");
  });
});