import { describe, it, expect, vi, beforeEach } from "vitest";
import { changeBehavior, makeSubstitution, submitPenaltyChoice, } from "./api";
import { apiClient } from "../../shared/api/client";

vi.mock("../../shared/api/client", () => ({
  apiClient: vi.fn(),
}));

describe("Match API - changeBehavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe invocar apiClient con PUT, la ruta correcta y behavior_id numérico en el body", async () => {
    apiClient.mockResolvedValue(null);

    const result = await changeBehavior(10, 4, "7");

    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(apiClient).toHaveBeenCalledWith("/live_match/10/me/4/behavior", {
      method: "PUT",
      body: JSON.stringify({ behavior_id: 7 }),
    });
    expect(result).toBeNull();
  });

  it("debe lanzar un error si falta matchId, playerId o behaviorId sin llamar a apiClient", async () => {
    const expectedMessage =
      "Se requieren matchId, playerId y behaviorId para cambiar el comportamiento";

    await expect(changeBehavior(undefined, 1, 2)).rejects.toThrow(expectedMessage);
    await expect(changeBehavior(null, 1, 2)).rejects.toThrow(expectedMessage);
    await expect(changeBehavior("", 1, 2)).rejects.toThrow(expectedMessage);
    await expect(changeBehavior(1, undefined, 2)).rejects.toThrow(expectedMessage);
    await expect(changeBehavior(1, null, 2)).rejects.toThrow(expectedMessage);
    await expect(changeBehavior(1, "", 2)).rejects.toThrow(expectedMessage);
    await expect(changeBehavior(1, 2, undefined)).rejects.toThrow(expectedMessage);
    await expect(changeBehavior(1, 2, null)).rejects.toThrow(expectedMessage);
    await expect(changeBehavior(1, 2, "")).rejects.toThrow(expectedMessage);

    expect(apiClient).not.toHaveBeenCalled();
  });

  it("debe propagar los errores devueltos por apiClient (400, 403, 404, etc.)", async () => {
    apiClient.mockRejectedValueOnce(new Error("Player is not on the field"));

    await expect(changeBehavior(10, 4, 5)).rejects.toThrow(
      "Player is not on the field"
    );
  });
});

describe("Match API - makeSubstitution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe invocar apiClient con PUT, la ruta correcta y new_player numérico en el body", async () => {
    apiClient.mockResolvedValue(null);

    const result = await makeSubstitution(10, 4, "7");

    expect(apiClient).toHaveBeenCalledTimes(1);
    expect(apiClient).toHaveBeenCalledWith("/live_match/10/me/4", {
      method: "PUT",
      body: JSON.stringify({ new_player: 7 }),
    });
    expect(result).toBeNull();
  });

  it("debe lanzar un error si falta matchId, playerId o newPlayerId sin llamar a apiClient", async () => {
    const expectedMessage =
      "Se requieren matchId, playerId y newPlayerId para realizar una sustitución";

    await expect(makeSubstitution(undefined, 4, 7)).rejects.toThrow(expectedMessage);
    await expect(makeSubstitution(null, 4, 7)).rejects.toThrow(expectedMessage);
    await expect(makeSubstitution("", 4, 7)).rejects.toThrow(expectedMessage);

    await expect(makeSubstitution(10, undefined, 7)).rejects.toThrow(expectedMessage);
    await expect(makeSubstitution(10, null, 7)).rejects.toThrow(expectedMessage);
    await expect(makeSubstitution(10, "", 7)).rejects.toThrow(expectedMessage);

    await expect(makeSubstitution(10, 4, undefined)).rejects.toThrow(expectedMessage);
    await expect(makeSubstitution(10, 4, null)).rejects.toThrow(expectedMessage);
    await expect(makeSubstitution(10, 4, "")).rejects.toThrow(expectedMessage);

    expect(apiClient).not.toHaveBeenCalled();
  });

  it("debe propagar los errores devueltos por apiClient", async () => {
    apiClient.mockRejectedValueOnce(new Error("Substitution limit reached"));

    await expect(makeSubstitution(10, 4, 7)).rejects.toThrow(
      "Substitution limit reached"
    );
  });
});


describe("Match API - submitPenaltyChoice", () => {
  beforeEach(() => {
    apiClient.mockReset();
  });

  it.each(["LEFT", "CENTER", "RIGHT"])(
    "envía la elección %s mediante POST",
    async (side) => {
      apiClient.mockResolvedValueOnce(null);

      const result = await submitPenaltyChoice(10, 1, side);

      expect(apiClient).toHaveBeenCalledTimes(1);

      expect(apiClient).toHaveBeenCalledWith(
        "/live_match/10/penalties/choices",
        {
          method: "POST",
          body: JSON.stringify({
            turn: 1,
            side,
          }),
        },
      );

      expect(result).toBeNull();
    },
  );

  it.each([403, 404, 409])(
    "propaga el error HTTP %s sin reemplazarlo",
    async (status) => {
      const error = new Error(`Error HTTP ${status}`);
      error.status = status;

      apiClient.mockRejectedValueOnce(error);

      await expect(
        submitPenaltyChoice(10, 1, "LEFT"),
      ).rejects.toBe(error);

      expect(apiClient).toHaveBeenCalledTimes(1);
    },
  );
});
