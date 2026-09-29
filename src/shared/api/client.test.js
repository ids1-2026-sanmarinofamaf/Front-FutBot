import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./client.js";

describe("apiClient", () => {

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("no hace el fetch si no existe un token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(
      apiClient("/users/me", {
        method: "GET"
      })
    ).rejects.toThrow("No hay token de autenticación");

    expect(fetchMock).not.toHaveBeenCalled();
  });


  it("hace el fetch enviando el token", async () => {
    localStorage.setItem("token", "abc123");

    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          username: "test"
        })
      });

    await apiClient("/users/me", {
      method: "GET"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/users/me`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer abc123"
        }
      }
    );
  });


  it("lanza un error si el backend responde 401", async () => {
    localStorage.setItem("token", "abc123");

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          response: "Token inválido"
        })
      });

    await expect(
      apiClient("/users/me", {
        method: "GET"
      })
    ).rejects.toThrow("Token inválido");
  });


  it("devuelve null cuando el backend responde 204", async () => {
    localStorage.setItem("token", "abc123");

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 204
      });

    const result = await apiClient("/users/me", {
      method: "DELETE"
    });

    expect(result).toBeNull();
  });


  it("devuelve el JSON cuando el backend responde correctamente", async () => {
    localStorage.setItem("token", "abc123");

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          username: "luca"
        })
      });

    const result = await apiClient("/users/me", {
      method: "GET"
    });

    expect(result).toEqual({
      id: 1,
      username: "luca"
    });
  });

});