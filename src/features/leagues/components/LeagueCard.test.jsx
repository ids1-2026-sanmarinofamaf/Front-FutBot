import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LeagueCard } from "./LeagueCard";

vi.mock("../api", () => ({
  joinLeagueAsPlayer: vi.fn(),
}));

vi.mock("../LeaguesProvider", () => ({
  useLeaguesSocket: vi.fn(),
}));

vi.mock("../../../shared/hooks", () => ({
  useToast: vi.fn(() => ({
    toast: { id: 1 },
    showToast: vi.fn(),
    hideToast: vi.fn(),
  })),
}));

// Módulo falso para el componente de alerta (evita dependencias de UI)
vi.mock("../../../shared/components/RightDownAlert", () => ({
  default: ({ errorDescription }) => <div data-testid="toast-alert">{errorDescription}</div>,
}));

import { joinLeagueAsPlayer } from "../api";
import { useLeaguesSocket } from "../LeaguesProvider";

describe("LeagueCard", () => {
  let mockJoinL;

  const defaultLeague = {
    id_liga: 1,
    name: "Liga Test",
    current_participants: 3,
    capacity: 8,
    privacy: "PUBLICA",
    state: "POR_COMENZAR",
  };

  const validRoster = { players: [1, 2, 3, 4, 5, 6] };
  const invalidRoster = { players: [] };

  beforeEach(() => {
    vi.clearAllMocks();
    mockJoinL = vi.fn();
    useLeaguesSocket.mockReturnValue({ joinL: mockJoinL, joinedLIds: [] });
  });

  describe("render", () => {
    it("renderiza los datos de la liga", () => {
      render(<LeagueCard league={defaultLeague} roster={validRoster} />);
      expect(screen.getByText("Liga Test")).toBeInTheDocument();
      expect(screen.getByText(/Usuarios: 3 de 8/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacidad: Pública/i)).toBeInTheDocument();
      expect(screen.getByText(/estado: POR_COMENZAR/i)).toBeInTheDocument();
    });

    it("muestra la privacidad PRIVADA", () => {
      render(<LeagueCard league={{ ...defaultLeague, privacy: "PRIVADA" }} roster={validRoster} />);
      expect(screen.getByText(/Privacidad: Privada/i)).toBeInTheDocument();
    });

    it("no muestra el botón Ver (no hay espectador)", () => {
      render(<LeagueCard league={defaultLeague} roster={validRoster} />);
      expect(screen.queryByRole("button", { name: "Ver" })).not.toBeInTheDocument();
    });

    it("funciona fuera del provider (contexto nulo)", () => {
      useLeaguesSocket.mockReturnValue(null);
      render(<LeagueCard league={defaultLeague} roster={validRoster} />);
      expect(screen.getByRole("button", { name: "Unirse" })).toBeEnabled();
    });
  });

  describe("habilitación del botón Unirse", () => {
    it("está habilitado con plantilla, cupo y liga POR_COMENZAR", () => {
      render(<LeagueCard league={defaultLeague} roster={validRoster} />);
      expect(screen.getByRole("button", { name: "Unirse" })).toBeEnabled();
    });

    it("se deshabilita si no hay plantilla cargada", () => {
      render(<LeagueCard league={defaultLeague} roster={invalidRoster} />);
      expect(screen.getByRole("button", { name: "Unirse" })).toBeDisabled();
    });

    it("se deshabilita si el roster es null", () => {
      render(<LeagueCard league={defaultLeague} roster={null} />);
      expect(screen.getByRole("button", { name: "Unirse" })).toBeDisabled();
    });

    it("se deshabilita si la liga está llena", () => {
      render(<LeagueCard league={{ ...defaultLeague, current_participants: 8 }} roster={validRoster} />);
      expect(screen.getByRole("button", { name: "Unirse" })).toBeDisabled();
    });

    it("se deshabilita si la liga ya está JUGANDO", () => {
      render(<LeagueCard league={{ ...defaultLeague, state: "JUGANDO" }} roster={validRoster} />);
      expect(screen.getByRole("button", { name: "Unirse" })).toBeDisabled();
    });

    it("muestra Unido (deshabilitado) si el id ya está en el provider", () => {
      useLeaguesSocket.mockReturnValue({ joinL: mockJoinL, joinedLIds: [1] });
      render(<LeagueCard league={defaultLeague} roster={validRoster} />);
      expect(screen.getByRole("button", { name: "Unido" })).toBeDisabled();
    });
  });

  describe("unirse a una liga pública", () => {
    it("hace el POST sin contraseña, abre el socket y pasa a Unido", async () => {
      joinLeagueAsPlayer.mockResolvedValueOnce({});
      render(<LeagueCard league={defaultLeague} roster={validRoster} />);

      fireEvent.click(screen.getByRole("button", { name: "Unirse" }));

      await waitFor(() => {
        expect(joinLeagueAsPlayer).toHaveBeenCalledWith(1, { roster: validRoster, password: undefined });
        expect(mockJoinL).toHaveBeenCalledWith(1);
      });
      expect(await screen.findByRole("button", { name: "Unido" })).toBeDisabled();
    });

    it("trata ALREADY_PARTICIPATING como unido", async () => {
      const error = new Error("Already inside");
      error.code = "ALREADY_PARTICIPATING";
      joinLeagueAsPlayer.mockRejectedValueOnce(error);
      render(<LeagueCard league={defaultLeague} roster={validRoster} />);

      fireEvent.click(screen.getByRole("button", { name: "Unirse" }));

      await waitFor(() => expect(mockJoinL).toHaveBeenCalledWith(1));
      expect(await screen.findByRole("button", { name: "Unido" })).toBeInTheDocument();
    });

    it("muestra alerta si la liga está llena (FULL) y no abre el socket", async () => {
      const error = new Error("full");
      error.code = "FULL";
      joinLeagueAsPlayer.mockRejectedValueOnce(error);
      render(<LeagueCard league={defaultLeague} roster={validRoster} />);

      fireEvent.click(screen.getByRole("button", { name: "Unirse" }));

      await waitFor(() => {
        expect(screen.getByTestId("toast-alert")).toHaveTextContent("La liga está llena");
      });
      expect(mockJoinL).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Unirse" })).toBeEnabled();
    });

    it("muestra alerta genérica ante cualquier otro error", async () => {
      joinLeagueAsPlayer.mockRejectedValueOnce(new Error("Network Error"));
      render(<LeagueCard league={defaultLeague} roster={validRoster} />);

      fireEvent.click(screen.getByRole("button", { name: "Unirse" }));

      await waitFor(() => {
        expect(screen.getByTestId("toast-alert")).toHaveTextContent("Error al unirse, intente en otro momento.");
      });
      expect(mockJoinL).not.toHaveBeenCalled();
    });

    it("deshabilita el botón mientras se procesa para evitar dobles envíos", async () => {
      let resolveJoin;
      joinLeagueAsPlayer.mockImplementationOnce(() => new Promise((resolve) => { resolveJoin = resolve; }));
      render(<LeagueCard league={defaultLeague} roster={validRoster} />);

      fireEvent.click(screen.getByRole("button", { name: "Unirse" }));

      await waitFor(() => expect(screen.getByRole("button", { name: "Unirse" })).toBeDisabled());
      expect(joinLeagueAsPlayer).toHaveBeenCalledTimes(1);

      resolveJoin({});
      expect(await screen.findByRole("button", { name: "Unido" })).toBeInTheDocument();
    });
  });

  describe("unirse a una liga privada", () => {
    const privateLeague = { ...defaultLeague, privacy: "PRIVADA" };

    it("abre el modal de contraseña sin hacer el POST todavía", () => {
      render(<LeagueCard league={privateLeague} roster={validRoster} />);

      fireEvent.click(screen.getByRole("button", { name: "Unirse" }));

      expect(screen.getByRole("dialog", { name: "Contraseña de la liga" })).toBeInTheDocument();
      expect(joinLeagueAsPlayer).not.toHaveBeenCalled();
    });

    it("Confirmar está deshabilitado con contraseña vacía o solo espacios", async () => {
      const user = userEvent.setup();
      render(<LeagueCard league={privateLeague} roster={validRoster} />);
      await user.click(screen.getByRole("button", { name: "Unirse" }));

      expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();

      await user.type(screen.getByLabelText("Contraseña:"), "   ");
      expect(screen.getByRole("button", { name: "Confirmar" })).toBeDisabled();
    });

    it("envía la contraseña junto al roster, abre el socket y cierra el modal", async () => {
      joinLeagueAsPlayer.mockResolvedValueOnce({});
      const user = userEvent.setup();
      render(<LeagueCard league={privateLeague} roster={validRoster} />);
      await user.click(screen.getByRole("button", { name: "Unirse" }));

      await user.type(screen.getByLabelText("Contraseña:"), "clave123");
      await user.click(screen.getByRole("button", { name: "Confirmar" }));

      await waitFor(() => {
        expect(joinLeagueAsPlayer).toHaveBeenCalledWith(1, { roster: validRoster, password: "clave123" });
        expect(mockJoinL).toHaveBeenCalledWith(1);
      });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("con contraseña incorrecta muestra alerta y mantiene el modal abierto", async () => {
      const error = new Error("Incorrect password");
      error.code = "INCORRECT_PASSWORD";
      joinLeagueAsPlayer.mockRejectedValueOnce(error);
      const user = userEvent.setup();
      render(<LeagueCard league={privateLeague} roster={validRoster} />);
      await user.click(screen.getByRole("button", { name: "Unirse" }));

      await user.type(screen.getByLabelText("Contraseña:"), "mala");
      await user.click(screen.getByRole("button", { name: "Confirmar" }));

      await waitFor(() => {
        expect(screen.getByTestId("toast-alert")).toHaveTextContent("Contraseña incorrecta");
      });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(mockJoinL).not.toHaveBeenCalled();
    });

    it("Cancelar cierra el modal sin hacer el POST", async () => {
      const user = userEvent.setup();
      render(<LeagueCard league={privateLeague} roster={validRoster} />);
      await user.click(screen.getByRole("button", { name: "Unirse" }));

      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(joinLeagueAsPlayer).not.toHaveBeenCalled();
    });
  });
});
