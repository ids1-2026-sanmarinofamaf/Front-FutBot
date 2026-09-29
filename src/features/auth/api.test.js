// api.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendDataToAPI, checkSession } from "./api.js";
import { apiClient } from "../../shared/api/client";

vi.mock("../../shared/api/client", () => ({
    apiClient: vi.fn(),
}));

describe("sendDataToAPI", () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    it("llama a fetch con el endpoint, método y body correctos", async () => {
        const user = { email: "a@a.com", password: "123" };
        global.fetch.mockResolvedValue({ ok: true });

        await sendDataToAPI(user);

        expect(global.fetch).toHaveBeenCalledWith(
            `${import.meta.env.VITE_API_URL}/sessions`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user),
            }
        );
    });

    it("devuelve la respuesta de fetch", async () => {
        const fakeResponse = { ok: true, json: vi.fn() };
        global.fetch.mockResolvedValue(fakeResponse);

        const result = await sendDataToAPI({});

        expect(result).toBe(fakeResponse);
    });

    it("propaga el error si fetch falla", async () => {
        global.fetch.mockRejectedValue(new Error("Network error"));

        await expect(sendDataToAPI({})).rejects.toThrow("Network error");
    });
});

describe("checkSession", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("devuelve la respuesta de apiClient si la sesión es válida", async () => {
        const fakeResponse = { ok: true };
        apiClient.mockResolvedValue(fakeResponse);
        const logout = vi.fn();

        const result = await checkSession(logout);

        expect(apiClient).toHaveBeenCalledWith("/users/me", { method: "GET" });
        expect(result).toBe(fakeResponse);
        expect(logout).not.toHaveBeenCalled();
    });

    it("llama a logout si el error es de sesión expirada/token inválido", async () => {
        const error = new Error("Sesión expirada o token inválido");
        apiClient.mockRejectedValue(error);
        const logout = vi.fn();

        await expect(checkSession(logout)).rejects.toThrow(error);
        expect(logout).toHaveBeenCalledTimes(1);
    });

    it("no llama a logout si el error es de otro tipo", async () => {
        const error = new Error("Error de red");
        apiClient.mockRejectedValue(error);
        const logout = vi.fn();

        await expect(checkSession(logout)).rejects.toThrow(error);
        expect(logout).not.toHaveBeenCalled();
    });
});