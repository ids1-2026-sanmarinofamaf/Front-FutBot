import { describe, it, expect, beforeEach } from "vitest";
import { saveTokenLocalStorage, getToken, removeToken } from "./auth.js";

describe("auth localStorage helpers", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe("saveTokenLocalStorage", () => {
        it("guarda el token en localStorage", () => {
            saveTokenLocalStorage({ token: "abc123" });
            expect(localStorage.getItem("token")).toBe("abc123");
        });

        it("sobreescribe un token existente", () => {
          localStorage.setItem("token", "viejo");
          saveTokenLocalStorage({ token: "nuevo" });
          expect(localStorage.getItem("token")).toBe("nuevo");
        });
});

describe("getToken", () => {
    it("devuelve el token guardado", () => {
        localStorage.setItem("token", "abc123");
        expect(getToken()).toBe("abc123");
    });

    it("devuelve null si no hay token", () => {
        expect(getToken()).toBeNull();
    });
});

describe("removeToken", () => {
    it("elimina el token de localStorage", () => {
        localStorage.setItem("token", "abc123");
        removeToken();
        expect(localStorage.getItem("token")).toBeNull();
    });

    it("no falla si no hay token para eliminar", () => {
        expect(() => removeToken()).not.toThrow();
    });
});
});