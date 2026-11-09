import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook,render, screen,  waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useWebSocket from "../../../shared/hooks";
import { AuthContext, AuthProvider } from "../AuthProvider.jsx";
import { MemoryRouter } from "react-router-dom";
import Login from "./LoginView.jsx";
import { checkSession } from "../api.js";
import { SessionSocketProvider } from "../SessionSocketProvider.jsx";
import AppRouter from "../../../app/AppRouter.jsx";

vi.mock("../api.js", async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        checkSession: vi.fn().mockResolvedValue({
            ok: true
        })
    };
});

class MockWebSocket {
    static instances = [];

    static OPEN = 1;
    static CLOSED = 3;

    constructor(url) {
        this.url = url;
        this.readyState = MockWebSocket.OPEN;

        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;

        MockWebSocket.instances.push(this);
    }

    send(data) {
        this.sentData = data;
    }

    close() {
        this.readyState = MockWebSocket.CLOSED;

        if (this.onclose) {
            this.onclose({
                code: 1000
            });
        }
    }
}

beforeEach(() => {
    vi.clearAllMocks();

    MockWebSocket.instances = [];
    
    vi.stubGlobal("WebSocket", MockWebSocket)

    vi.stubGlobal(
        "fetch",
        vi.fn((url, options) => {
            if (String(url).endsWith("/sessions") && options?.method === "POST") {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        token: "mock-token-123"
                    })
                });
            }

            return Promise.reject(
                new Error(`Endpoint no mockeado: ${url}`)
            );
        })
    );
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("Formulario y endpoint", () => {
    
        it("Funcionamiento del mock para POST /sessions", async () => {
            const response = await fetch("/sessions", {
                method: "POST"
            });
        
            const data = await response.json();
        
            expect(response.ok).toBe(true);
            expect(data.token).toBe("mock-token-123");
        });
        
        it("envía el formulario de inicio de sesión al backend al clickear botón", async () => {
            const user = userEvent.setup();

            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({}),
            });

            render(
                <AuthProvider>
                    <SessionSocketProvider>
                        <AppRouter />
                    </SessionSocketProvider>
                </AuthProvider>
            );

            const email = screen.getByLabelText("Email:");
            const password = screen.getByLabelText("Contraseña:");
            const button = screen.getByRole("button", {
                name: "Iniciar sesión",
            });

            await user.type(email, "test@test.com");
            await user.type(password, "123456");
            await user.click(button);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                `${import.meta.env.VITE_API_URL}/sessions`,
                {
                    method: "POST",
                    headers: {
                    "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                    email: "test@test.com",
                    password: "123456",
                    }),
                }
                );
            });
            });
})

describe("Notificaciones de inicio de sesión", () => {
    const renderLogin = () => {
        const setIsAuthenticated = vi.fn();
        render(
            <MemoryRouter>
                <AuthContext.Provider value={{ setIsAuthenticated }}>
                    <Login />
                </AuthContext.Provider>
            </MemoryRouter>
        );
        return setIsAuthenticated;
    };

    const submitLogin = async (user) => {
        await user.type(screen.getByLabelText("Email:"), "test@test.com");
        await user.type(screen.getByLabelText("Contraseña:"), "123456");
        await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    };

    it.each([400, 401, 422])("muestra una alerta para HTTP %s y permite reintentar", async (status) => {
        const user = userEvent.setup();
        fetch.mockResolvedValue({ ok: false, status });
        const setIsAuthenticated = renderLogin();

        await submitLogin(user);

        expect(await screen.findByRole("alert")).toHaveTextContent("Email o contraseña incorrectos.");
        expect(setIsAuthenticated).not.toHaveBeenCalled();
        expect(checkSession).not.toHaveBeenCalled();

        await user.type(screen.getByLabelText("Contraseña:"), "7");
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Email o contraseña incorrectos.");
    });

    it.each(["servidor", "red"])("notifica un error de %s", async (failure) => {
        const user = userEvent.setup();
        vi.spyOn(console, "log").mockImplementation(() => {});
        if (failure === "red") {
            fetch.mockRejectedValue(new TypeError("Failed to fetch"));
        } else {
            fetch.mockResolvedValue({ ok: false, status: 500 });
        }
        const setIsAuthenticated = renderLogin();

        await submitLogin(user);

        expect(await screen.findByRole("alert")).toHaveTextContent("Intentá nuevamente más tarde.");
        expect(setIsAuthenticated).not.toHaveBeenCalled();
    });

    it("mantiene el inicio de sesión exitoso sin alertas", async () => {
        const user = userEvent.setup();
        const setIsAuthenticated = renderLogin();

        await submitLogin(user);

        await waitFor(() => expect(setIsAuthenticated).toHaveBeenCalledWith(true));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(localStorage.getItem("token")).toBe("mock-token-123");
        localStorage.removeItem("token");
    });
});

describe("useWebSocket para ws de sesiones", () => {

    it("genera una conexión WebSocket con la URL indicada", () => {
        const url = "ws://localhost:8000/ws/lobby?token=mock-token";

        renderHook(() => useWebSocket(url));

        expect(MockWebSocket.instances).toHaveLength(1);

        expect(MockWebSocket.instances[0].url).toBe(url);
    });

});
