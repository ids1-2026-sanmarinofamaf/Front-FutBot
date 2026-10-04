import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FriendlyGames from "./FriendlyGameView";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

// Se mockean los hijos: acá solo se prueba la lógica de FriendlyGames
// (mostrar/ocultar el modal), no el formulario de creación.
vi.mock("../components/CreateFG", () => ({
    default: ({ onClose }) => (
        <div role="dialog" aria-label="Crear partido amistoso">
            <button onClick={onClose}>cerrar modal</button>
        </div>
    ),
}));

vi.mock("../../roster/components/RosterBuilder", () => ({
    RosterBuilder: () => null,
}));

beforeEach(() => navigate.mockClear());
afterEach(cleanup);

describe("FriendlyGames", () => {
    describe("render", () => {
        it("muestra el título de la pantalla", () => {
            render(<FriendlyGames />);
            expect(
                screen.getByRole("heading", { level: 1, name: "PARTIDOS AMISTOSOS" })
            ).toBeInTheDocument();
        });

        it("muestra el botón NUEVO", () => {
            render(<FriendlyGames />);
            expect(screen.getByRole("button", { name: "NUEVO" })).toBeInTheDocument();
        });

        it("muestra el botón para volver al menú", () => {
            render(<FriendlyGames />);
            expect(screen.getByRole("button", { name: "Volver al menú" })).toBeInTheDocument();
        });

        it("no muestra el modal de creación al iniciar", () => {
            render(<FriendlyGames />);
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });

    describe("interacciones", () => {
        it("abre el modal de creación al hacer click en NUEVO", async () => {
            const user = userEvent.setup();
            render(<FriendlyGames />);

            await user.click(screen.getByRole("button", { name: "NUEVO" }));

            expect(
                screen.getByRole("dialog", { name: "Crear partido amistoso" })
            ).toBeInTheDocument();
        });

        it("cierra el modal cuando CreateFG llama a onClose", async () => {
            const user = userEvent.setup();
            render(<FriendlyGames />);
            await user.click(screen.getByRole("button", { name: "NUEVO" }));

            await user.click(screen.getByRole("button", { name: "cerrar modal" }));

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("conserva el título y el botón NUEVO mientras el modal está abierto", async () => {
            const user = userEvent.setup();
            render(<FriendlyGames />);

            await user.click(screen.getByRole("button", { name: "NUEVO" }));

            expect(screen.getByRole("heading", { name: "PARTIDOS AMISTOSOS" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "NUEVO" })).toBeInTheDocument();
        });
    });

    describe("volver al menú", () => {
        it("navega a la raíz al hacer click en Volver al menú", async () => {
            const user = userEvent.setup();
            render(<FriendlyGames />);

            await user.click(screen.getByRole("button", { name: "Volver al menú" }));

            expect(navigate).toHaveBeenCalledTimes(1);
            expect(navigate).toHaveBeenCalledWith("/");
        });

        it("no abre el modal de creación al volver al menú", async () => {
            const user = userEvent.setup();
            render(<FriendlyGames />);

            await user.click(screen.getByRole("button", { name: "Volver al menú" }));

            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });

    describe("casos borde", () => {
        it("no duplica el modal si se hace click en NUEVO varias veces", async () => {
            const user = userEvent.setup();
            render(<FriendlyGames />);

            await user.click(screen.getByRole("button", { name: "NUEVO" }));
            await user.click(screen.getByRole("button", { name: "NUEVO" }));
            await user.click(screen.getByRole("button", { name: "NUEVO" }));

            expect(screen.getAllByRole("dialog")).toHaveLength(1);
        });

        it("permite abrir el modal de nuevo después de cerrarlo", async () => {
            const user = userEvent.setup();
            render(<FriendlyGames />);

            await user.click(screen.getByRole("button", { name: "NUEVO" }));
            await user.click(screen.getByRole("button", { name: "cerrar modal" }));
            await user.click(screen.getByRole("button", { name: "NUEVO" }));

            expect(screen.getByRole("dialog")).toBeInTheDocument();
        });
    });
});