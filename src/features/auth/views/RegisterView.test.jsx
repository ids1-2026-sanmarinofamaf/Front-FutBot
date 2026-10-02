import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { sendRegisterToAPI } from "../api.js";
import RegisterView from "./RegisterView.jsx";

vi.mock("../api.js", () => ({
  sendRegisterToAPI: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();

  sendRegisterToAPI.mockResolvedValue({
    status: 201,
    ok: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderRegisterView = () => render(
        <MemoryRouter initialEntries={["/register"]}>
        <RegisterView />
        </MemoryRouter>
);

const createJpg = (size = 100) => new File([new Uint8Array(size)], "avatar.jpg", {
        type: "image/jpeg",
});

{/** Se rellena el formulario */}
async function fillValidForm(user) {
    
    await user.type(
        screen.getByLabelText("Email:"),
        "jugador@dominio.com"
    );

    await user.type(
        screen.getByLabelText("Contraseña:"),
        "abc123"
    );

    await user.type(
        screen.getByLabelText("Repita contraseña:"),
        "abc123"
    );

    await user.type(
        screen.getByLabelText("Nombre de club:"),
        "San Marino"
    );

    await user.upload(
        screen.getByLabelText("Avatar:"),
        createJpg()
    );
}

describe("RegisterView", () => {
    /** Clean up */
    beforeEach(() => {
        vi.clearAllMocks();

        sendRegisterToAPI.mockResolvedValue({
        status: 201,
        ok: true,
        });
    });

    it("muestra los cinco campos requeridos", () => {
        renderRegisterView();

        expect(screen.getByLabelText("Email:")).toBeInTheDocument();
        expect(screen.getByLabelText("Contraseña:")).toBeInTheDocument();
        expect(screen.getByLabelText("Repita contraseña:")).toBeInTheDocument();
        expect(screen.getByLabelText("Nombre de club:")).toBeInTheDocument();
        expect(screen.getByLabelText("Avatar:")).toBeInTheDocument();
    });

    it("mantiene deshabilitado el botón hasta completar todos los campos", async () => {
        const user = userEvent.setup();
        renderRegisterView();

        const button = screen.getByRole("button", {
        name: "Registrarse",
        });

        expect(button).toBeDisabled();

        await fillValidForm(user);

        await waitFor(() => {
        expect(button).toBeEnabled();
        });
    });

    it("envía todos los datos al registrarse", async () => {
        const user = userEvent.setup();
        renderRegisterView();

        await fillValidForm(user);

        await user.click(
        screen.getByRole("button", { name: "Registrarse" })
        );

        await waitFor(() => {
        expect(sendRegisterToAPI).toHaveBeenCalledWith({
            email: "jugador@dominio.com",
            password: "abc123",
            clubname: "San Marino",
            avatar: expect.any(String),
        });
        });
    });

    it("notifica que el registro fue exitoso", async () => {
        const user = userEvent.setup();
        renderRegisterView();

        await fillValidForm(user);

        await user.click(
        screen.getByRole("button", { name: "Registrarse" })
        );

        expect(
        await screen.findByRole("alert")
        ).toHaveTextContent("Usuario registrado correctamente");
    });

    it("no envía el formulario si el email es inválido", async () => {
        const user = userEvent.setup();
        renderRegisterView();

        await fillValidForm(user);

        const email = screen.getByLabelText("Email:");
        await user.clear(email);
        await user.type(email, "email-invalido");

        await user.click(
        screen.getByRole("button", { name: "Registrarse" })
        );

        expect(await screen.findByRole("alert")).toBeInTheDocument();
        expect(sendRegisterToAPI).not.toHaveBeenCalled();
    });

    it("no envía el formulario si el nombre del club tiene números", async () => {
        const user = userEvent.setup();
        renderRegisterView();

        await fillValidForm(user);

        const club = screen.getByLabelText("Nombre de club:");
        await user.clear(club);
        await user.type(club, "Club123");

        await user.click(
        screen.getByRole("button", { name: "Registrarse" })
        );

        expect(await screen.findByRole("alert")).toBeInTheDocument();
        expect(sendRegisterToAPI).not.toHaveBeenCalled();
    });

    it("no envía el formulario si las contraseñas no coinciden", async () => {
        const user = userEvent.setup();
        renderRegisterView();

        await fillValidForm(user);

        const confirmation = screen.getByLabelText("Repita contraseña:");
        await user.clear(confirmation);
        await user.type(confirmation, "otra123");

        expect(sendRegisterToAPI).not.toHaveBeenCalled();
    });

    it("rechaza un avatar mayor a 1 MB", async () => {
        const user = userEvent.setup();
        renderRegisterView();

        const avatar = screen.getByLabelText("Avatar:");

        await user.upload(
        avatar,
        createJpg(1024 * 1024 + 1)
        );

        expect(
        await screen.findByRole("alert")
        ).toHaveTextContent(/supera 1 MB/i);

        expect(
        screen.getByRole("button", { name: "Registrarse" })
        ).toBeDisabled();
    });

    it("ofrece un enlace para volver al login", () => {
        renderRegisterView();

        const link = screen.getByRole("link", {
        name: "Iniciar sesión",
        });

        expect(link).toHaveAttribute("href", "/login");
    });

    it("notifica un email ya utilizado", async () => {
        sendRegisterToAPI.mockResolvedValueOnce({
            status: 400,
            ok: false,
            json: async () => ({
            response: "Email already used.",
            }),
        });

        const user = userEvent.setup();
        renderRegisterView();

        await fillValidForm(user);

        await user.click(
            screen.getByRole("button", { name: "Registrarse" })
        );

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent(/email ya utilizado/i);

        await waitFor(() => {
            expect(sendRegisterToAPI).toHaveBeenCalledWith({
            email: "jugador@dominio.com",
            password: "abc123",
            clubname: "San Marino",
            avatar: expect.any(String),
            });
        });
    });
});