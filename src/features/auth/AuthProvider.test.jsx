import React from 'react';

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { useContext } from "react";

// import '@testing-library/jest-dom/extend-expect';

import { AuthProvider, AuthContext } from "./AuthProvider.jsx";
import { getToken } from "./auth.js";
import { checkSession } from "./api.js";

vi.mock("./auth.js", () => ({
    getToken: vi.fn(),
}));

vi.mock("./api.js", () => ({
    checkSession: vi.fn(),
}));

const TestComponent = () => {
    const { isAuthenticated, logout } = useContext(AuthContext);

    return (
        <>
            <div data-testid="auth-status">
                {String(isAuthenticated)}
            </div>
            <button onClick={logout}>Logout</button>
        </>
    );
};

describe("AuthProvider", () => {

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        cleanup();
    });

    it("no autentica si no existe token", async () => {
        getToken.mockReturnValue(null);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("auth-status").textContent).toBe("false");
        });

        expect(checkSession).not.toHaveBeenCalled();
    });

    it("no verifica la sesión si no existe un token", async () => {
        getToken.mockReturnValue(null);

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("auth-status").textContent).toBe("false");
        });

        expect(checkSession).not.toHaveBeenCalled();
    });

    it("autentica al usuario si el token existe y la sesión es válida", async () => {
        getToken.mockReturnValue("abc123");
        checkSession.mockResolvedValue({ ok: true });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("auth-status").textContent).toBe("true");
        });

        expect(checkSession).toHaveBeenCalled();
    });
    
    it("logout elimina el token y desautentica al usuario", async () => {
        getToken.mockReturnValue("abc123");
        checkSession.mockResolvedValue({ ok: true });
        localStorage.setItem("token", "abc123");

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId("auth-status").textContent).toBe("true");
        });

        screen.getByRole("button", { name: "Logout" }).click();

        expect(localStorage.getItem("token")).toBeNull();

        await waitFor(() => {
            expect(screen.getByTestId("auth-status").textContent).toBe("false");
        });
    });

    it("muestra Cargando mientras verifica la sesión", async () => {
        getToken.mockReturnValue("abc123");

        let resolveSession;

        checkSession.mockReturnValue(
            new Promise((resolve) => {
                resolveSession = resolve;
            })
        );

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId("loading")).not.toBeNull();

        resolveSession({ ok: true });

        await waitFor(() => {
            expect(screen.getByTestId("auth-status").textContent).toBe("true");
        });
    });

});