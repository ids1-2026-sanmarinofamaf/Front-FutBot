import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import CreateFG from "./CreateFG";
import { sendNewFM } from "../api";

// --- Mocks de las dependencias externas --------------------------------
const navigate = vi.fn();
const joinFG = vi.fn();

vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("../api", () => ({ sendNewFM: vi.fn() }));
vi.mock("../FriendlyGamesProvider", () => ({
    useFriendlyGamesSocket: () => ({ joinFG }),
}));

const ROSTER = {
    formation: "ofensiva",
    players: Array.from({ length: 6 }, (_, i) => ({
        player_id: i + 1,
        is_starter: i < 3,
        slot: i < 3 ? `A${i + 1}` : null,
        initial_behavior_id: i < 3 ? 1 : null,
    })),
};
const INCOMPLETE_ROSTER = { formation: "ofensiva", players: ROSTER.players.slice(0, 4) };

// RosterBuilder simulado: permite confirmar o cancelar la plantilla
let nextRoster = ROSTER;
vi.mock("../../roster/components/RosterBuilder", () => ({
    RosterBuilder: ({ onSubmit, onCancel }) => (
        <div data-testid="roster-builder">
        <button onClick={() => onSubmit(nextRoster)}>confirmar plantilla</button>
        <button onClick={onCancel}>cancelar plantilla</button>
        </div>
    ),
}));

// --- Helpers ---------------------------------------------------------------
const onClose = vi.fn();

const setup = () => {
    const user = userEvent.setup();
    render(<CreateFG onClose={onClose} />);
    return user;
};

const loadRoster = async (user) => {
    await user.click(screen.getByRole("button", { name: "Editar plantilla" }));
    await user.click(screen.getByRole("button", { name: "confirmar plantilla" }));
};

// El componente lee `response.id_friendlyGame`
const FG_ID = 4;

beforeEach(() => {
    vi.clearAllMocks();
    nextRoster = ROSTER;
    sendNewFM.mockResolvedValue({ id_friendlyGame: FG_ID });
    vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(cleanup);

describe("CreateFG", () => {
    describe("render", () => {
        it("muestra el título, la duración por defecto y los botones", () => {
            setup();
            
            expect(screen.getByRole("heading", { name: "Crear partido amistoso" })).toBeInTheDocument();
            expect(screen.getByLabelText("Duración del partido (minutos):")).toHaveValue(300);
            expect(screen.getByRole("button", { name: "Editar plantilla" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "CREAR" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Cerrar opciones" })).toBeInTheDocument();
        });
        
        it("no muestra el constructor de plantilla ni la confirmación al iniciar", () => {
            setup();
            
            expect(screen.queryByTestId("roster-builder")).not.toBeInTheDocument();
            expect(screen.queryByText("Partido creado")).not.toBeInTheDocument();
        });
        
        it("el botón CREAR está deshabilitado mientras no haya plantilla", () => {
            setup();
            expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
        });
    });
    
    describe("duración", () => {
        it("permite cambiar la duración", async () => {
            const user = setup();
            const input = screen.getByLabelText("Duración del partido (minutos):");
            
            await user.clear(input);
            await user.type(input, "90");
            
            expect(input).toHaveValue(90);
        });
        
        it("deshabilita CREAR si la duración queda vacía o en 0, aunque haya plantilla", async () => {
            const user = setup();
            await loadRoster(user);
            expect(screen.getByRole("button", { name: "CREAR" })).toBeEnabled();
            
            await user.clear(screen.getByLabelText("Duración del partido (minutos):"));
            
            expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
        });

        it("deshabilita CREAR para una duración negativa", async () => {
            const user = setup();
            await loadRoster(user);

            const input = screen.getByLabelText("Duración del partido (minutos):");
            fireEvent.change(input, { target: { value: "-1" } });

            expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
        });

        it("deshabilita CREAR para una duración decimal fuera del paso permitido", async () => {
            const user = setup();
            await loadRoster(user);

            const input = screen.getByLabelText("Duración del partido (minutos):");
            fireEvent.change(input, { target: { value: "0.5" } });

            expect(input).toBeInvalid();
            expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
        });

        it("declara un máximo y deshabilita CREAR por encima de ese máximo", async () => {
            const user = setup();
            const input = screen.getByLabelText("Duración del partido (minutos):");
            const max = input.getAttribute("max");

            expect(max).not.toBeNull();

            await loadRoster(user);
            await user.clear(input);
            await user.type(input, String(Number(max) + 1));

            expect(input).toBeInvalid();
            expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
        });
    });
    
    describe("constructor de plantilla", () => {
        it("Editar plantilla muestra el constructor y oculta ese botón", async () => {
            const user = setup();
            
            await user.click(screen.getByRole("button", { name: "Editar plantilla" }));
            
            expect(screen.getByTestId("roster-builder")).toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Editar plantilla" })).not.toBeInTheDocument();
        });
        
        it("cancelar el constructor lo oculta y CREAR sigue deshabilitado", async () => {
            const user = setup();
            await user.click(screen.getByRole("button", { name: "Editar plantilla" }));
            
            await user.click(screen.getByRole("button", { name: "cancelar plantilla" }));
            
            expect(screen.queryByTestId("roster-builder")).not.toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Editar plantilla" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
        });
        
        it("confirmar una plantilla de 6 jugadores oculta el constructor y habilita CREAR", async () => {
            const user = setup();
            
            await loadRoster(user);
            
            expect(screen.queryByTestId("roster-builder")).not.toBeInTheDocument();
            expect(screen.getByRole("button", { name: "CREAR" })).toBeEnabled();
        });
        
        it("una plantilla con menos de 6 jugadores mantiene CREAR deshabilitado", async () => {
            nextRoster = INCOMPLETE_ROSTER;
            const user = setup();
            
            await loadRoster(user);
            
            expect(screen.getByRole("button", { name: "CREAR" })).toBeDisabled();
        });
    });
    
    describe("cerrar", () => {
        it("la × llama a onClose", async () => {
            const user = setup();
            await user.click(screen.getByRole("button", { name: "Cerrar opciones" }));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
        
        it("Cancelar llama a onClose", async () => {
            const user = setup();
            await user.click(screen.getByRole("button", { name: "Cancelar" }));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
    
    describe("creación del partido", () => {
        it("envía la duración y la plantilla al backend", async () => {
            const user = setup();
            await loadRoster(user);
            
            await user.click(screen.getByRole("button", { name: "CREAR" }));
            
            expect(sendNewFM).toHaveBeenCalledTimes(1);
            expect(sendNewFM).toHaveBeenCalledWith({ duration: 300, roster: ROSTER });
        });

        it("usa una copia de la plantilla para el amistoso sin mutar la plantilla original", async () => {
            const originalRoster = structuredClone(ROSTER);
            const user = setup();

            await loadRoster(user);
            await user.click(screen.getByRole("button", { name: "CREAR" }));

            expect(ROSTER).toEqual(originalRoster);
            expect(sendNewFM).toHaveBeenCalledWith({ duration: 300, roster: ROSTER });
        });
        
        it("envía la duración modificada", async () => {
            const user = setup();
            const input = screen.getByLabelText("Duración del partido (minutos):");
            await user.clear(input);
            await user.type(input, "90");
            await loadRoster(user);
            
            await user.click(screen.getByRole("button", { name: "CREAR" }));
            
            expect(sendNewFM).toHaveBeenCalledWith({ duration: 90, roster: ROSTER });
        });
        
        it("si sale bien, abre el WebSocket del partido y muestra la confirmación", async () => {
            const user = setup();
            await loadRoster(user);
            
            await user.click(screen.getByRole("button", { name: "CREAR" }));
            
            expect(joinFG).toHaveBeenCalledWith(FG_ID);
            expect(await screen.findByText("Partido creado")).toBeInTheDocument();
            expect(screen.getByText("¿Querés ir a la vista del partido ahora?")).toBeInTheDocument();
        });
        
        it("si falla, no abre el WebSocket ni muestra la confirmación, y no rompe", async () => {
            sendNewFM.mockRejectedValue(new Error("Datos inválidos"));
            const user = setup();
            await loadRoster(user);
            
            await user.click(screen.getByRole("button", { name: "CREAR" }));
            
            expect(sendNewFM).toHaveBeenCalledTimes(1);
            expect(joinFG).not.toHaveBeenCalled();
            expect(screen.queryByText("Partido creado")).not.toBeInTheDocument();
            expect(screen.getByRole("button", { name: "CREAR" })).toBeInTheDocument();
        });

        it("acepta el nombre de ID definido por la respuesta real del backend", async () => {
            sendNewFM.mockResolvedValue({ id_friendlyMatch: FG_ID });
            const user = setup();
            await loadRoster(user);

            await user.click(screen.getByRole("button", { name: "CREAR" }));

            expect(joinFG).toHaveBeenCalledWith(FG_ID);
            expect(await screen.findByText("Partido creado")).toBeInTheDocument();
        });

        it("no confirma la creación ni abre el WebSocket si la respuesta no trae ID", async () => {
            sendNewFM.mockResolvedValue({ roster_id: 9 });
            const user = setup();
            await loadRoster(user);

            await user.click(screen.getByRole("button", { name: "CREAR" }));

            expect(joinFG).not.toHaveBeenCalled();
            expect(screen.queryByText("Partido creado")).not.toBeInTheDocument();
        });

        it("muestra un error visible si falla la creación", async () => {
            sendNewFM.mockRejectedValue(new Error("Datos inválidos"));
            const user = setup();
            await loadRoster(user);

            await user.click(screen.getByRole("button", { name: "CREAR" }));

            expect(await screen.findByRole("alert")).toHaveTextContent(
                "No se pudo enviar solicitud al servidor"
            );
        });
    });
    
    describe("confirmación de creación", () => {
        const createFG = async () => {
            const user = setup();
            await loadRoster(user);
            await user.click(screen.getByRole("button", { name: "CREAR" }));
            await screen.findByText("Partido creado");
            return user;
        };
        
        it("Volver a la lista cierra el modal sin navegar", async () => {
            const user = await createFG();
            
            await user.click(screen.getByRole("button", { name: "Volver a la lista" }));
            
            expect(onClose).toHaveBeenCalledTimes(1);
            expect(navigate).not.toHaveBeenCalled();
        });
        
        it("Ir al partido cierra el modal y navega a la vista del partido", async () => {
            const user = await createFG();
            
            await user.click(screen.getByRole("button", { name: "Ir al partido" }));
            
            expect(onClose).toHaveBeenCalledTimes(1);
            expect(navigate).toHaveBeenCalledWith(`/friendly/${FG_ID}`);
        });
        
        it("el WebSocket ya quedó abierto antes de decidir si navegar", async () => {
            await createFG();
            
            expect(joinFG).toHaveBeenCalledWith(FG_ID);
            expect(navigate).not.toHaveBeenCalled();
        });
    });
});