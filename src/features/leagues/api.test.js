import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendNewL, joinLeagueAsPlayer } from "./api";
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

describe("joinLeagueAsPlayer", () => {
  const roster = newLeaguePayload.roster;

  it("hace POST a /leagues/{id}/users", async () => {
    apiClient.mockResolvedValue({});

    await joinLeagueAsPlayer(7, { roster });

    const [endpoint, options] = apiClient.mock.calls[0];
    expect(endpoint).toBe("/leagues/7/users");
    expect(options.method).toBe("POST");
  });

  it("envía solo el roster si no hay contraseña (liga pública)", async () => {
    apiClient.mockResolvedValue({});

    await joinLeagueAsPlayer(7, { roster });

    const [, options] = apiClient.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ roster });
  });

  it("envía roster y password si hay contraseña (liga privada)", async () => {
    apiClient.mockResolvedValue({});

    await joinLeagueAsPlayer(7, { roster, password: "clave" });

    const [, options] = apiClient.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ roster, password: "clave" });
  });

  it("devuelve la respuesta del backend", async () => {
    apiClient.mockResolvedValue({ ok: true });

    await expect(joinLeagueAsPlayer(7, { roster })).resolves.toEqual({ ok: true });
  });

  it.each([
    ["User is already participating in this league", "ALREADY_PARTICIPATING"],
    ["Incorrect password", "INCORRECT_PASSWORD"],
    ["League is already full.", "FULL"],
  ])("mapea el error '%s' al código %s", async (message, code) => {
    apiClient.mockRejectedValue(new Error(message));

    await expect(joinLeagueAsPlayer(7, { roster })).rejects.toMatchObject({ code });
  });

  it("propaga errores desconocidos sin código", async () => {
    const error = new Error("Network Error");
    apiClient.mockRejectedValue(error);

    await expect(joinLeagueAsPlayer(7, { roster })).rejects.toBe(error);
    expect(error.code).toBeUndefined();
  });
});

