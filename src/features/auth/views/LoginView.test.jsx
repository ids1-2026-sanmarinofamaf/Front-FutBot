import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook,render, screen,  waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import useWebSocket from "../../../shared/hooks";

import LoginView from "./LoginView";
import { AuthProvider } from "../AuthProvider.jsx";

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
        
        it("envía el formulario de inicio de sesión al backend", async () => {
            render(
                <AuthProvider>
                    <LoginView />
                </AuthProvider>
            );
        
            const email = screen.getByLabelText("Email:");
            const password = screen.getByLabelText("Contraseña:");
            const button = screen.getByRole("button", {
                name: "Iniciar sesión"
            });
        
            await userEvent.type(email, "test@test.com");
            await userEvent.type(password, "123456");
        
            await userEvent.click(button);
        
            expect(global.fetch).toHaveBeenCalledWith(
                `${import.meta.env.VITE_API_URL}/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "test@test.com",
                    password: "123456"
                })
            });
        });
})

describe("useWebSocket para ws de sesiones", () => {

    it("genera una conexión WebSocket con la URL indicada", () => {
        const url = "ws://localhost:8000/ws/lobby?token=mock-token";

        renderHook(() => useWebSocket(url));

        expect(MockWebSocket.instances).toHaveLength(1);

        expect(MockWebSocket.instances[0].url).toBe(url);
    });

});