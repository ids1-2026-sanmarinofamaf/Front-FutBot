import { describe, it, expect, vi, beforeEach } from "vitest";
import { changeBehavior } from "./api";
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

