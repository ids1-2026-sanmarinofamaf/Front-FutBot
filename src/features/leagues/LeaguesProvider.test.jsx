import { useEffect, useState } from "react";
import { render, screen, act, within, cleanup, renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LeaguesSocketProvider, useLeaguesSocket } from "./LeaguesProvider";
import useWebSocket from "../../shared/hooks";

// Se mockea el hook del WebSocket: no se abren conexiones reales.
// El mock registra qué sockets se "abren" (mount) y "cierran" (unmount)
// y guarda los handlers para poder simular mensajes y cierres del servidor.
vi.mock("../../shared/hooks", () => ({ default: vi.fn() }));

const STORAGE_KEY = "lIds";

let opened; // urls abiertas, en orden
let closed; // urls cerradas, en orden
let handlers; // url -> options (con el onMessage / onClose más reciente)
let live; // urls con socket montado ahora mismo

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

const socketPath = (id) => `/ws/league/${id}`;
const urlFor = (id) => Object.keys(handlers).find((u) => u.includes(socketPath(id)));
const wasOpened = (id) => opened.some((u) => u.includes(socketPath(id)));
const wasClosed = (id) => closed.some((u) => u.includes(socketPath(id)));
const countOpened = (id) =>
    opened.filter((u) => u.includes(socketPath(id))).length;

// Simula un mensaje que llega del servidor por el socket de la liga `id`
const emit = (id, msg) => act(() => handlers[urlFor(id)].onMessage(msg));

// Devuelve las options del socket de la liga solo si sigue montado
const socketFor = (id) => {
    const url = [...live].find((u) => u.includes(socketPath(id)));
    return url ? handlers[url] : undefined;
};

const storedIds = () => JSON.parse(sessionStorage.getItem(STORAGE_KEY));

// Componente de prueba: expone las funciones y los mensajes del contexto
function Consumer() {
    const { messages, joinL, leaveL, leaveAll } = useLeaguesSocket();
    return (
        <div>
            <button onClick={() => joinL(3)}>unirse 3</button>
            <button onClick={() => joinL(7)}>unirse 7</button>
            <button onClick={() => leaveL(3)}>salir 3</button>
            <button onClick={leaveAll}>salir de todas</button>
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
    render(<LeaguesSocketProvider>{ui}</LeaguesSocketProvider>);

// Para probar el contexto directamente, sin UI
const wrapper = ({ children }) => (
    <LeaguesSocketProvider>{children}</LeaguesSocketProvider>
);
const setup = () => renderHook(() => useLeaguesSocket(), { wrapper });

describe("LeaguesSocketProvider", () => {

    describe("render", () => {

        it("renderiza a sus hijos", () => {
            renderProvider(<p>contenido de la app</p>);
            expect(screen.getByText("contenido de la app")).toBeInTheDocument();
        });

        it("no abre ningún socket al iniciar y no hay mensajes", () => {
            renderProvider();
            expect(opened).toHaveLength(0);
            expect(screen.getByRole("list", { name: "mensajes 3" })).toBeEmptyDOMElement();
        });
    });

    describe("joinL", () => {

        it("abre un socket con la URL de la liga", async () => {
            const user = userEvent.setup();
            renderProvider();

            await user.click(screen.getByRole("button", { name: "unirse 3" }));

            expect(opened).toHaveLength(1);
            expect(opened[0]).toContain("/ws/league/3");
        });

        it("no duplica la conexión si se une dos veces a la misma liga", async () => {
            const user = userEvent.setup();
            renderProvider();

            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            await user.click(screen.getByRole("button", { name: "unirse 3" }));

            expect(countOpened(3)).toBe(1);
        });

        it("mantiene un socket por cada liga distinta", async () => {
            const user = userEvent.setup();
            renderProvider();

            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            await user.click(screen.getByRole("button", { name: "unirse 7" }));

            expect(wasOpened(3)).toBe(true);
            expect(wasOpened(7)).toBe(true);
            expect(opened).toHaveLength(2);
        });
    });

    describe("leaveL y leaveAll", () => {

        it("leaveL cierra solo el socket indicado", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            await user.click(screen.getByRole("button", { name: "unirse 7" }));

            await user.click(screen.getByRole("button", { name: "salir 3" }));

            expect(wasClosed(3)).toBe(true);
            expect(wasClosed(7)).toBe(false);
        });

        it("leaveAll cierra todos los sockets", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            await user.click(screen.getByRole("button", { name: "unirse 7" }));

            await user.click(screen.getByRole("button", { name: "salir de todas" }));

            expect(wasClosed(3)).toBe(true);
            expect(wasClosed(7)).toBe(true);
        });

        it("leaveAll sin sockets abiertos no rompe nada", async () => {
            const user = userEvent.setup();
            renderProvider();

            await user.click(screen.getByRole("button", { name: "salir de todas" }));

            expect(closed).toHaveLength(0);
        });
    });

    describe("manejo de mensajes (handleMessage)", () => {

        it("guarda el mensaje recibido y lo muestra en la vista", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));

            emit(3, { type: "estado" });

            const list = screen.getByRole("list", { name: "mensajes 3" });
            expect(within(list).getByText("estado")).toBeInTheDocument();
        });

        it("acumula los mensajes de la misma liga en orden de llegada", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));

            emit(3, { type: "a" });
            emit(3, { type: "b" });
            emit(3, { type: "c" });

            const items = within(screen.getByRole("list", { name: "mensajes 3" })).getAllByRole("listitem");
            expect(items.map((li) => li.textContent)).toEqual(["a", "b", "c"]);
        });

        it("no mezcla los mensajes de ligas distintas", async () => {
            const user = userEvent.setup();
            renderProvider();
            await user.click(screen.getByRole("button", { name: "unirse 3" }));
            await user.click(screen.getByRole("button", { name: "unirse 7" }));

            emit(3, { type: "de-3" });
            emit(7, { type: "de-7" });

            const list3 = screen.getByRole("list", { name: "mensajes 3" });
            const list7 = screen.getByRole("list", { name: "mensajes 7" });
            expect(within(list3).getAllByRole("listitem")).toHaveLength(1);
            expect(within(list3).getByText("de-3")).toBeInTheDocument();
            expect(within(list7).getAllByRole("listitem")).toHaveLength(1);
            expect(within(list7).getByText("de-7")).toBeInTheDocument();
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
            emit(3, { type: "a" });

            await user.click(screen.getByRole("button", { name: "cambiar vista" }));
            expect(wasClosed(3)).toBe(false); // el socket NO se cerró

            emit(3, { type: "b" });

            await user.click(screen.getByRole("button", { name: "cambiar vista" }));
            const items = within(screen.getByRole("list", { name: "mensajes 3" })).getAllByRole("listitem");
            expect(items.map((li) => li.textContent)).toEqual(["a", "b"]);
            expect(countOpened(3)).toBe(1); // y no se reabrió
        });
    });

    describe("persistencia (recarga)", () => {

        it("guarda los ids en sessionStorage al unirse y al salir", () => {
            const { result } = setup();
            act(() => {
                result.current.joinL(1);
                result.current.joinL(2);
            });
            expect(storedIds()).toEqual([1, 2]);

            act(() => result.current.leaveL(1));
            expect(storedIds()).toEqual([2]);
        });

        it("expone los ids unidos en joinedLIds", () => {
            const { result } = setup();
            act(() => result.current.joinL(5));
            expect(result.current.joinedLIds).toEqual([5]);
        });

        it("joinL ignora IDs inválidos", () => {
            const { result } = setup();

            act(() => {
                result.current.joinL(0);
                result.current.joinL(-1);
                result.current.joinL("7");
                result.current.joinL(2.5);
                result.current.joinL(4);
            });

            expect(storedIds()).toEqual([4]);
            expect(opened).toHaveLength(1);
        });

        it("al montar reconecta las ligas guardadas", () => {
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

        it("ignora un valor válido en storage que no sea un array", () => {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 3 }));

            expect(() => setup()).not.toThrow();
            expect(live.size).toBe(0);
        });

        it("ignora IDs inválidos o manipulados y elimina duplicados", () => {
            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify([3, 3, 0, -1, "7", null, {}, 4.5, 7])
            );

            setup();

            expect(opened).toHaveLength(2);
            expect(socketFor(3)).toBeDefined();
            expect(socketFor(7)).toBeDefined();
        });

        it("mantiene las conexiones aunque sessionStorage no pueda escribirse", () => {
            const setItemSpy = vi
                .spyOn(Storage.prototype, "setItem")
                .mockImplementation(() => {
                    throw new Error("Storage lleno");
                });
            const { result } = setup();

            expect(() => act(() => result.current.joinL(3))).not.toThrow();
            expect(live.size).toBe(1);

            setItemSpy.mockRestore();
        });
    });

    describe("cierre del servidor", () => {

        it.each([1000, 4403, 4404, 4409])(
            "con %s quita la liga, su conexión y el id guardado",
            (code) => {
                const { result } = setup();
                act(() => result.current.joinL(1));

                act(() => socketFor(1).onClose({ code }));

                expect(socketFor(1)).toBeUndefined();
                expect(storedIds()).toEqual([]);
            }
        );

        it("con otro código (ej. 1006) no quita la liga", () => {
            const { result } = setup();
            act(() => result.current.joinL(1));

            act(() => socketFor(1).onClose({ code: 1006 }));

            expect(socketFor(1)).toBeDefined();
            expect(storedIds()).toEqual([1]);
        });
    });

    describe("sesión expirada", () => {

        it("auth:expired cierra todo y limpia mensajes y storage", () => {
            const { result } = setup();
            act(() => {
                result.current.joinL(1);
                result.current.joinL(2);
            });
            act(() => socketFor(1).onMessage({ type: "a" }));

            act(() => {
                window.dispatchEvent(new Event("auth:expired"));
            });

            expect(live.size).toBe(0);
            expect(result.current.messages).toEqual({});
            expect(storedIds()).toEqual([]);
        });

        it("auth:logout cierra sockets y limpia storage", () => {
            const { result } = setup();
            act(() => result.current.joinL(1));

            act(() => {
                window.dispatchEvent(new Event("auth:logout"));
            });

            expect(live.size).toBe(0);
            expect(result.current.messages).toEqual({});
            expect(storedIds()).toEqual([]);
        });
    });

    describe("useLeaguesSocket fuera del provider", () => {

        it("devuelve null (el consumidor debe estar dentro del provider)", () => {
            let value;
            function Probe() {
                value = useLeaguesSocket();
                return null;
            }
            render(<Probe />);
            expect(value).toBeNull();
        });
    });
});

