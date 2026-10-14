import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendNewL } from "./api";
import { apiClient } from "../../shared/api/client";

// Se mockea apiClient: se prueba que sendNewL arme y despache correctamente la solicitud HTTP.
vi.mock("../../shared/api/client", () => ({ apiClient: vi.fn() }));

const newLeaguePayload = {
  nombre: "Liga Pro",
  duracion_partido: 120,
  max_usuarios: 8,
  es_privada: true,
  password: "supersecretpassword",
  roster: {
    formation: "offensive",
    players: [
      { player_id: 1, is_starter: true, slot: "left", initial_behavior_id: 1 },
      { player_id: 2, is_starter: true, slot: "center", initial_behavior_id: 2 },
      { player_id: 3, is_starter: true, slot: "right", initial_behavior_id: 3 },
      { player_id: 4, is_starter: false, slot: null, initial_behavior_id: null },
      { player_id: 5, is_starter: false, slot: null, initial_behavior_id: null },
      { player_id: 6, is_starter: false, slot: null, initial_behavior_id: null },
    ],
  },
};

beforeEach(() => {
  apiClient.mockReset();
});

describe("sendNewL", () => {
  it("hace POST a /leagues", async () => {
    apiClient.mockResolvedValue({ id_liga: 1 });

    await sendNewL(newLeaguePayload);

    expect(apiClient).toHaveBeenCalledTimes(1);
    const [endpoint, options] = apiClient.mock.calls[0];
    expect(endpoint).toBe("/leagues");
    expect(options.method).toBe("POST");
  });

  it("envía los datos serializados como JSON en el body", async () => {
    apiClient.mockResolvedValue({ id_liga: 1 });

    await sendNewL(newLeaguePayload);

    const [, options] = apiClient.mock.calls[0];
    expect(typeof options.body).toBe("string");
    expect(JSON.parse(options.body)).toEqual(newLeaguePayload);
  });

  it("devuelve la respuesta del backend", async () => {
    const backendResponse = { id_liga: 15, name: "Liga Pro" };
    apiClient.mockResolvedValue(backendResponse);

    const result = await sendNewL(newLeaguePayload);

    expect(result).toEqual(backendResponse);
  });

  it("propaga el error si apiClient falla (ej. validación del backend)", async () => {
    apiClient.mockRejectedValue(new Error("Missing body requirement"));

    await expect(sendNewL(newLeaguePayload)).rejects.toThrow("Missing body requirement");
  });

  it("propaga el error si no hay token de autenticación", async () => {
    apiClient.mockRejectedValue(new Error("No hay token de autenticación"));

    await expect(sendNewL(newLeaguePayload)).rejects.toThrow("No hay token de autenticación");
  });

  it("envía los datos sin mutar el objeto original", async () => {
    apiClient.mockResolvedValue({ id_liga: 1 });
    const payloadClone = structuredClone(newLeaguePayload);

    await sendNewL(newLeaguePayload);

    expect(newLeaguePayload).toEqual(payloadClone);
  });
});

