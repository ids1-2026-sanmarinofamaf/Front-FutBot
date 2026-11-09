// SessionSocketProvider.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useContext } from "react";
import { AuthContext } from "./AuthProvider.jsx";
import { SessionSocketContext, SessionSocketProvider } from "./SessionSocketProvider.jsx";
import useWebSocket from "../../shared/hooks.js";
import { getToken } from "./auth.js";

import { renderHook } from "@testing-library/react";

function useSessionSocketWrapper({ isAuthenticated }) {
  return renderHook(() => useContext(SessionSocketContext), {
    wrapper: ({ children }) => (
      <AuthContext.Provider value={{ isAuthenticated }}>
        <SessionSocketProvider>{children}</SessionSocketProvider>
      </AuthContext.Provider>
    ),
  });
}

vi.mock("../../shared/hooks.js", () => ({
  default: vi.fn(),
}));

vi.mock("./auth.js", () => ({
  getToken: vi.fn(),
}));

vi.stubEnv("VITE_WS_SESSION_URL", "wss://test-server:8000");

{/*
function Consumer() {
  const { isConnected } = useContext(SessionSocketContext);
  return <span data-testid="status">{isConnected ? "connected" : "disconnected"}</span>;
}
  */}

let capturedContext;

function Consumer() {
  capturedContext = useContext(SessionSocketContext);
  return null; // no necesita renderizar nada visible
}

function renderWithAuth({ isAuthenticated }) {
  return render(
    <AuthContext.Provider value={{ isAuthenticated }}>
      <SessionSocketProvider>
        <Consumer />
      </SessionSocketProvider>
    </AuthContext.Provider>
  );
}

describe("SessionSocketProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("no llama a useWebSocket con una url cuando el usuario no está autenticado", () => {
        renderWithAuth({ isAuthenticated: false });

        expect(useWebSocket).toHaveBeenCalledTimes(1);
        const [url] = useWebSocket.mock.calls[0];
        expect(url).toBeNull();
    });

    it("construye la url del websocket con el token cuando el usuario está autenticado", () => {
        getToken.mockReturnValue("abc123");

        renderWithAuth({ isAuthenticated: true });

        const [url] = useWebSocket.mock.calls[0];
        expect(url).toBe("wss://test-server:8000/ws/sessions?token=abc123");
    });


    it("arranca con isConnected en false", () => {
        getToken.mockReturnValue("abc123");
        renderWithAuth({ isAuthenticated: true });
        expect(capturedContext.isConnected).toBe(false);
    });

    it("pone isConnected en true cuando se dispara onOpen", () => {
        getToken.mockReturnValue("abc123");
        renderWithAuth({ isAuthenticated: true });

        const { onOpen } = useWebSocket.mock.calls[0][1];
        act(() => {
            onOpen();
        });

        expect(capturedContext.isConnected).toBe(true);
    });

    it("pone isConnected en false cuando se dispara onClose", () => {
        getToken.mockReturnValue("abc123");
        renderWithAuth({ isAuthenticated: true });

        const { onOpen, onClose } = useWebSocket.mock.calls[0][1];
        act(() => {
            onOpen();
        });
        expect(capturedContext.isConnected).toBe(true);

        act(() => {
            onClose();
        });
        expect(capturedContext.isConnected).toBe(false);
    });

    it("actualiza los mensajes con los datos recibidos por onMessage", () => {
        getToken.mockReturnValue("abc123");
        renderWithAuth({ isAuthenticated: true });

        const { onMessage } = useWebSocket.mock.calls[0][1];
        const payload = { friendly_games: [{ id: 1 }] };
        act(() => {
            onMessage(payload);
        });

        expect(capturedContext.messages).toEqual({
          friendly_games: [{id: 1}],
          leagues: [],
        });
    });

    it("conserva los amistosos cuando recibe una actualización de ligas", () => {
        getToken.mockReturnValue("abc123");
        renderWithAuth({ isAuthenticated: true });

        const { onMessage } = useWebSocket.mock.calls[0][1];

        act(() => {
            onMessage({
                friendly_games: [{ id: 1 }],
                leagues: [{ league_id: 10, name: "Liga A" }],
            });
        });

        act(() => {
            onMessage({
                leagues: [{ league_id: 10, name: "Liga A", current_participants: 3 }],
            });
        });

        expect(capturedContext.messages).toEqual({
            friendly_games: [{ id: 1 }],
            leagues: [
                {
                    league_id: 10,
                    name: "Liga A",
                    current_participants: 3,
                },
            ],
        });
    });
    it("conserva las ligas cuando recibe una actualización de amistosos", () => {
        getToken.mockReturnValue("abc123");
        renderWithAuth({ isAuthenticated: true });

        const { onMessage } = useWebSocket.mock.calls[0][1];

        act(() => {
            onMessage({
                friendly_games: [{ id: 1 }],
                leagues: [{ league_id: 10, name: "Liga A" }],
            });
        });

        act(() => {
            onMessage({
                friendly_games: [{ id: 2 }],
            });
        });

        expect(capturedContext.messages).toEqual({
            friendly_games: [{ id: 2 }],
            leagues: [{ league_id: 10, name: "Liga A" }],
        });
    });
});
