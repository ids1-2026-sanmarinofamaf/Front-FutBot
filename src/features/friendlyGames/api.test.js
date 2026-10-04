import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendNewFM } from "./api";
import { apiClient } from "../../shared/api/client";

// Se mockea apiClient: acá solo se prueba que sendNewFM arme bien el request.
vi.mock("../../shared/api/client", () => ({ apiClient: vi.fn() }));

const newFG = {
  duration: 300,
  roster: {
    formation: "ofensiva",
    players: [
      { player_id: 1, is_starter: true, slot: "A1", initial_behavior_id: 1 },
      { player_id: 2, is_starter: true, slot: "A2", initial_behavior_id: 2 },
      { player_id: 3, is_starter: true, slot: "A3", initial_behavior_id: 3 },
      { player_id: 4, is_starter: false, slot: null, initial_behavior_id: null },
      { player_id: 5, is_starter: false, slot: null, initial_behavior_id: null },
      { player_id: 6, is_starter: false, slot: null, initial_behavior_id: null },
    ],
  },
};

beforeEach(() => {
  apiClient.mockReset();
});

describe("sendNewFM", () => {
    it("hace POST a /friendly_games", async () => {
        apiClient.mockResolvedValue({});

        await sendNewFM(newFG);

        expect(apiClient).toHaveBeenCalledTimes(1);
        const [endpoint, options] = apiClient.mock.calls[0];
        expect(endpoint).toBe("/friendly_games");
        expect(options.method).toBe("POST");
    });

    it("envía los datos serializados como JSON en el body", async () => {
        apiClient.mockResolvedValue({});

        await sendNewFM(newFG);

        const [, options] = apiClient.mock.calls[0];
        expect(typeof options.body).toBe("string");
        expect(JSON.parse(options.body)).toEqual(newFG);
    });

    it("devuelve la respuesta del backend", async () => {
        const backendResponse = { id_friendlyMatch: 4, roster_id: 9 };
        apiClient.mockResolvedValue(backendResponse);

        const result = await sendNewFM(newFG);

        expect(result).toEqual(backendResponse);
    });

    it("propaga el error si apiClient falla (ej. 400 'Datos inválidos')", async () => {
        apiClient.mockRejectedValue(new Error("Datos inválidos"));

        await expect(sendNewFM(newFG)).rejects.toThrow("Datos inválidos");
    });

    it("propaga el error si no hay token de sesión", async () => {
        apiClient.mockRejectedValue(new Error("No hay token de autenticación"));

        await expect(sendNewFM(newFG)).rejects.toThrow("No hay token de autenticación");
    });

    it("envía los datos tal cual, sin validarlos (responsabilidad del backend)", async () => {
        apiClient.mockResolvedValue({});
        const incomplete = { duration: 300, roster: {} };

        await sendNewFM(incomplete);

        const [, options] = apiClient.mock.calls[0];
        expect(JSON.parse(options.body)).toEqual(incomplete);
    });
});