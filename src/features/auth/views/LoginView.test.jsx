import { it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginView from "./LoginView";

{/*Mock del backend*/}
beforeEach(() => {
    vi.stubGlobal(
        "fetch",
        vi.fn((url, options) => {
            if (url === "/sessions" && options?.method === "POST") {
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

it("Funcionamiento del mock para POST /sessions", async () => {
    const response = await fetch("/sessions", {
        method: "POST"
    });

    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.token).toBe("mock-token-123");
})

it("envía el formulario de inicio de sesión al backend", async () => {
    render(<LoginView />);

    const email = screen.getByLabelText("Email:");
    const password = screen.getByLabelText("Contraseña:");
    const button = screen.getByRole("button", { name: "Iniciar sesión" });

    await userEvent.type(email, "test@test.com");
    await userEvent.type(password, "123456");

    await userEvent.click(button);

    expect(fetch).toHaveBeenCalledWith("/sessions", {
        method: "POST",
        body: JSON.stringify({
            email: "test@test.com",
            password: "123456"
        })
    });
});
