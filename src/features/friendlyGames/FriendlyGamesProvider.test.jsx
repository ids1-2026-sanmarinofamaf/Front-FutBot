import { useEffect, useState } from "react";
import { render, screen, act, within, cleanup, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    FriendlyGamesSocketProvider,
    useFriendlyGamesSocket,
} from "./FriendlyGamesProvider";
import useWebSocket from "../../shared/hooks";

// Se mockea el hook del WebSocket: no se abren conexiones reales.
// El mock registra qué sockets se "abren" (mount) y "cierran" (unmount)
// y guarda los handlers para poder simular mensajes y cierres del servidor.
vi.mock("../../shared/hooks", () => ({ default: vi.fn() }));

const STORAGE_KEY = "fgIds";

let opened; // urls abiertas, en orden
let closed; // urls cerradas, en orden
let handlers; // url -> options (con el onMessage / onClose más reciente)
let live; // urls con socket montado ahora mismo

// Desmonta lo renderizado entre tests (necesario si vitest no usa globals)
afterEach(cleanup);

beforeEach(() => {
    opened = [];
    closed = [];
    handlers = {};
    live = new Set();
    sessionStorage.clear();
    useWebSocket.mockReset();
    useWebSocket.mockImplementation((url, options) => {
        handlers[url] = options;
        useEffect(() => {
            opened.push(url);
            live.add(url);
            return () => {
                closed.push(url);
                live.delete(url);
            };
        }, [url]);
    });
});

const socketPath = (id) => `/ws/friendly_game/${id}`;
const urlFor = (id) => Object.keys(handlers).find((u) => u.includes(socketPath(id)));
const wasOpened = (id) => opened.some((u) => u.includes(socketPath(id)));
const wasClosed = (id) => closed.some((u) => u.includes(socketPath(id)));
const countOpened = (id) =>
    opened.filter((u) => u.includes(socketPath(id))).length;

// Simula un mensaje que llega del servidor por el socket del partido `id`
const emit = (id, msg) => act(() => handlers[urlFor(id)].onMessage(msg));

// Devuelve las options del socket del partido solo si sigue montado
const socketFor = (id) => {
    const url = [...live].find((u) => u.includes(socketPath(id)));
    return url ? handlers[url] : undefined;
};

const storedIds = () => JSON.parse(sessionStorage.getItem(STORAGE_KEY));

// Componente de prueba: expone las funciones y los mensajes del contexto
function Consumer() {
    const { messages, joinFG, leaveFG, leaveAll } = useFriendlyGamesSocket();
    return (
        <div>
            <button onClick={() => joinFG(3)}>unirse 3</button>
            <button onClick={() => joinFG(7)}>unirse 7</button>
            <button onClick={() => leaveFG(3)}>salir 3</button>
            <button onClick={leaveAll}>salir de todos</button>
            {[3, 7].map((id) => (
                <ul key={id} aria-label={`mensajes ${id}`}>
                    {(messages[id] ?? []).map((m, i) => (
                        <li key={i}>{m.type}</li>
                    ))}
                </ul>
            ))}
        </div>
    );
}

const renderProvider = (ui = <Consumer />) =>
    render(<FriendlyGamesSocketProvider>{ui}</FriendlyGamesSocketProvider>);

// Para probar el contexto directamente, sin UI
const wrapper = ({ children }) => (
    <FriendlyGamesSocketProvider>{children}</FriendlyGamesSocketProvider>
);
const setup = () => renderHook(() => useFriendlyGamesSocket(), { wrapper });

describe("FriendlyGamesSocketProvider", () => {

    describe("render", () => {

        it("renderiza a sus hijos", () => {
            renderProvider(<p>contenido de la app</p>);
            expect(screen.getByText("contenido de la app")).toBeInTheDocument();
        });

        it("no abre ningún socket al iniciar y no hay mensajes", () => {
            renderProvider();
            expect(opened).toHaveLength(0);
            expect(screen.getByRole("list", { name: "mensajes 3" })).toBeEmptyDOMElement();
            expect(screen.getByRole("list", { name: "mensajes 7" })).toBeEmptyDOMElement();
        });
    });

    describe("joinFG", () => {

        it("abre un socket con la URL del partido", async () => {
            const user = userEvent.setup();
            renderProvider();

            await user.click(screen.getByRole("button", { name: "unirse 3" }));

            expect(opened).toHaveLength(1);
            expect(opened[0]).toContain("/ws/friendly_game/3");
        });

        it("no duplica la conexión si se une dos veces al mismo partido", async () => {
            const user = userEvent.setup();
            renderProvider();

            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            await user.click(screen.getByRole("button", { name: "unirse 3" }));

            expect(countOpened(3)).toBe(1);
        });

        it("mantiene un socket por cada partido distinto", async () => {
            const user = userEvent.setup();
            renderProvider();

            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            await user.click(screen.getByRole("button", { name: "unirse 7" }));

            expect(wasOpened(3)).toBe(true);
            expect(wasOpened(7)).toBe(true);
            expect(opened).toHaveLength(2);
        });
    });

    describe("leaveFG y leaveAll", () => {

        it("leaveFG cierra solo el socket indicado", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            await user.click(screen.getByRole("button", { name: "unirse 7" }));

            await user.click(screen.getByRole("button", { name: "salir 3" }));

            expect(wasClosed(3)).toBe(true);
            expect(wasClosed(7)).toBe(false);
        });

        it("leaveFG sobre un partido al que no se unió no rompe nada", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 7" }));

            await user.click(screen.getByRole("button", { name: "salir 3" }));

            expect(closed).toHaveLength(0);
            expect(screen.getByRole("list", { name: "mensajes 7" })).toBeInTheDocument();
        });

        it("leaveAll cierra todos los sockets", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            await user.click(screen.getByRole("button", { name: "unirse 7" }));

            await user.click(screen.getByRole("button", { name: "salir de todos" }));

            expect(wasClosed(3)).toBe(true);
            expect(wasClosed(7)).toBe(true);
        });

        it("leaveAll sin sockets abiertos no rompe nada", async () => {
            const user = userEvent.setup();
            renderProvider();

            await user.click(screen.getByRole("button", { name: "salir de todos" }));

            expect(closed).toHaveLength(0);
        });
    });

    describe("manejo de mensajes (handleMessage)", () => {

        it("guarda el mensaje recibido y lo muestra en la vista", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));

            emit(3, { type: "match_started" });

            const list = screen.getByRole("list", { name: "mensajes 3" });
            expect(within(list).getByText("match_started")).toBeInTheDocument();
        });

        it("acumula los mensajes del mismo partido en orden de llegada", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));

            emit(3, { type: "match_started" });
            emit(3, { type: "goal" });
            emit(3, { type: "match_finished" });

            const items = within(screen.getByRole("list", { name: "mensajes 3" })).getAllByRole("listitem");
            expect(items.map((li) => li.textContent)).toEqual([
                "match_started",
                "goal",
                "match_finished",
            ]);
        });

        it("no mezcla los mensajes de partidos distintos", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            await user.click(screen.getByRole("button", { name: "unirse 7" }));

            emit(3, { type: "goal" });
            emit(7, { type: "match_started" });

            const list3 = screen.getByRole("list", { name: "mensajes 3" });
            const list7 = screen.getByRole("list", { name: "mensajes 7" });
            expect(within(list3).getAllByRole("listitem")).toHaveLength(1);
            expect(within(list3).getByText("goal")).toBeInTheDocument();
            expect(within(list7).getAllByRole("listitem")).toHaveLength(1);
            expect(within(list7).getByText("match_started")).toBeInTheDocument();
        });

        it("un partido sin mensajes devuelve lista vacía sin romper la vista", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));

            expect(screen.getByRole("list", { name: "mensajes 3" })).toBeEmptyDOMElement();
        });

        it("conserva los mensajes ya recibidos después de salir del partido", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            emit(3, { type: "goal" });

            await user.click(screen.getByRole("button", { name: "salir 3" }));

            const list = screen.getByRole("list", { name: "mensajes 3" });
            expect(within(list).getByText("goal")).toBeInTheDocument();
        });
    });

    describe("persistencia entre vistas", () => {

        function Toggle() {
            const [visible, setVisible] = useState(true);
            return (
                <>
                    <button onClick={() => setVisible((v) => !v)}>cambiar vista</button>
                    {visible && <Consumer />}
                </>
            );
        }

        it("el socket sigue abierto y los mensajes se conservan al desmontar y volver a montar la vista", async () => {
            const user = userEvent.setup();
            renderProvider(<Toggle />);
            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            emit(3, { type: "goal" });

            // "Salgo" de la vista: el Consumer se desmonta
            await user.click(screen.getByRole("button", { name: "cambiar vista" }));
            expect(screen.queryByRole("list", { name: "mensajes 3" })).not.toBeInTheDocument();
            expect(wasClosed(3)).toBe(false); // el socket NO se cerró

            // Llega un mensaje mientras no estoy en la vista
            emit(3, { type: "match_finished" });

            // "Vuelvo" a la vista
            await user.click(screen.getByRole("button", { name: "cambiar vista" }));
            const items = within(screen.getByRole("list", { name: "mensajes 3" })).getAllByRole("listitem");
            expect(items.map((li) => li.textContent)).toEqual(["goal", "match_finished"]);
            expect(countOpened(3)).toBe(1); // y no se reabrió
        });
    });

    describe("persistencia (recarga)", () => {

        it("guarda los ids en sessionStorage al unirse y al salir", () => {
            const { result } = setup();
            act(() => {
                result.current.joinFG(1);
                result.current.joinFG(2);
            });
            expect(storedIds()).toEqual([1, 2]);

            act(() => result.current.leaveFG(1));
            expect(storedIds()).toEqual([2]);
        });

        it("joinFG con un id repetido no duplica el id guardado", () => {
            const { result } = setup();
            act(() => result.current.joinFG(1));
            act(() => result.current.joinFG(1));
            expect(live.size).toBe(1);
            expect(storedIds()).toEqual([1]);
        });

        it("al montar reconecta los partidos guardados", () => {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify([3, 4]));
            setup();
            expect(socketFor(3)).toBeDefined();
            expect(socketFor(4)).toBeDefined();
        });

        it("si el storage está corrupto arranca sin conexiones", () => {
            sessionStorage.setItem(STORAGE_KEY, "no-es-json");
            setup();
            expect(live.size).toBe(0);
        });
    });

    describe("cierre del servidor", () => {

        it("con 4404 (partido inexistente) quita el id y su conexión", () => {
            const { result } = setup();
            act(() => result.current.joinFG(1));

            act(() => socketFor(1).onClose({ code: 4404 }));

            expect(socketFor(1)).toBeUndefined();
            expect(storedIds()).toEqual([]);
        });

        it("con otro código (ej. 1006) no quita el partido", () => {
            const { result } = setup();
            act(() => result.current.joinFG(1));

            act(() => socketFor(1).onClose({ code: 1006 }));

            expect(socketFor(1)).toBeDefined();
            expect(storedIds()).toEqual([1]);
        });
    });

    describe("sesión expirada", () => {

        it("auth:expired cierra todo y limpia mensajes y storage", () => {
            const { result } = setup();
            act(() => {
                result.current.joinFG(1);
                result.current.joinFG(2);
            });
            act(() => socketFor(1).onMessage({ type: "a" }));

            act(() => {
                window.dispatchEvent(new Event("auth:expired"));
            });

            expect(live.size).toBe(0);
            expect(result.current.messages).toEqual({});
            expect(storedIds()).toEqual([]);
        });
    });

    describe("useFriendlyGamesSocket fuera del provider", () => {

        it("devuelve null (el consumidor debe estar dentro del provider)", () => {
            let value;
            function Probe() {
                value = useFriendlyGamesSocket();
                return null;
            }
            render(<Probe />);
            expect(value).toBeNull();
        });
    });
});
