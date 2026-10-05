import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import useWebSocket from './hooks';
import { useToast } from "./hooks.js";

class MockWebSocket {
    static OPEN = 1;
    static CLOSED = 3;

    constructor(url) {
        this.url = url;
        this.readyState = MockWebSocket.OPEN;

        MockWebSocket.instance = this;

        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;
    }

    send(data) {
        this.sentData = data;
    }

    close(code, reason) {
        this.readyState = MockWebSocket.CLOSED;
        this.closeCode = code;
        this.closeReason = reason;

        this.onclose?.({
            code,
            reason
        });
    }

    triggerOpen() {
        this.onopen?.();
    }

    triggerMessage(data) {
        this.onmessage?.({
            data: JSON.stringify(data)
        });
    }

    triggerRawMessage(data) {
        this.onmessage?.({ data });
    }

    triggerClose(code = 1000) {
        this.onclose?.({ code });
    }

    triggerError() {
        this.onerror?.();
    }
}

global.WebSocket = MockWebSocket;

describe('useWebSocket', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        MockWebSocket.instance = null;
    });

    test('crea una conexión WebSocket al montar el hook', () => {
        renderHook(() =>
            useWebSocket('ws://localhost:8000/ws')
        );

        expect(MockWebSocket.instance).not.toBeNull();
        expect(MockWebSocket.instance.url).toBe(
            'ws://localhost:8000/ws'
        );
    });

    test('ejecuta onOpen cuando se abre la conexión', () => {
        const onOpen = vi.fn();

        renderHook(() =>
            useWebSocket('ws://localhost:8000/ws', {
                onOpen
            })
        );

        act(() => {
            MockWebSocket.instance.triggerOpen();
        });

        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    test('ejecuta onMessage cuando recibe un mensaje', () => {
        const onMessage = vi.fn();

        renderHook(() =>
            useWebSocket('ws://localhost:8000/ws', {
                onMessage
            })
        );

        act(() => {
            MockWebSocket.instance.triggerMessage({
                type: 'test',
                value: 123
            });
        });

        expect(onMessage).toHaveBeenCalledWith({
            type: 'test',
            value: 123
        });
    });

    test('ejecuta onClose cuando se cierra la conexión', () => {
        const onClose = vi.fn();

        renderHook(() =>
            useWebSocket('ws://localhost:8000/ws', {
                onClose
            })
        );

        act(() => {
            MockWebSocket.instance.triggerClose(1000);
        });

        expect(onClose).toHaveBeenCalledWith({
            code: 1000
        });
    });

    test('send envía datos cuando el WebSocket está abierto', () => {
        const { result } = renderHook(() =>
            useWebSocket('ws://localhost:8000/ws')
        );

        act(() => {
            result.current.send({
                type: 'login',
                token: 'abc123'
            });
        });

        expect(MockWebSocket.instance.sentData).toBe(
            JSON.stringify({
                type: 'login',
                token: 'abc123'
            })
        );
    });

    test('send no envía datos si el WebSocket no está abierto', () => {
        const { result } = renderHook(() =>
            useWebSocket('ws://localhost:8000/ws')
        );

        MockWebSocket.instance.readyState = MockWebSocket.CLOSED;

        act(() => {
            result.current.send({
                type: 'test'
            });
        });

        expect(MockWebSocket.instance.sentData).toBeUndefined();
    });

    test('cierra el WebSocket al desmontar el hook', () => {
        const { unmount } = renderHook(() =>
            useWebSocket('ws://localhost:8000/ws')
        );

        const socket = MockWebSocket.instance;

        unmount();

        expect(socket.closeCode).toBe(1000);
        expect(socket.closeReason).toBe('hook cleanup');
    });

    test('reintenta la conexión cuando se cierra inesperadamente', () => {
        vi.useFakeTimers();

        renderHook(() =>
            useWebSocket('ws://localhost:8000/ws', {
                reconnect: true
            })
        );

        const firstSocket = MockWebSocket.instance;

        act(() => {
            firstSocket.triggerClose(1006);
        });

        expect(MockWebSocket.instance).toBe(firstSocket);

        act(() => {
            vi.advanceTimersByTime(31000);
        });

        expect(MockWebSocket.instance).not.toBe(firstSocket);

        vi.useRealTimers();
    });

    test('no crea conexiones duplicadas si el mismo socket informa dos cierres', () => {
        vi.useFakeTimers();
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

        renderHook(() => useWebSocket('ws://localhost:8000/ws', { reconnect: true }));
        const firstSocket = MockWebSocket.instance;

        act(() => {
            firstSocket.triggerClose(1006);
            firstSocket.triggerClose(1006);
            vi.advanceTimersByTime(30000);
        });

        expect(MockWebSocket.instance).not.toBe(firstSocket);

        const secondSocket = MockWebSocket.instance;
        act(() => {
            secondSocket.triggerClose(1006);
            vi.advanceTimersByTime(30000);
        });

        expect(MockWebSocket.instance).not.toBe(firstSocket);
        expect(MockWebSocket.instance).not.toBe(secondSocket);

        randomSpy.mockRestore();
        vi.useRealTimers();
    });

    test('no reintenta cuando el servidor cierra con código 4409', () => {
        vi.useFakeTimers();

        renderHook(() => useWebSocket('ws://localhost:8000/ws', { reconnect: true }));
        const socket = MockWebSocket.instance;

        act(() => {
            socket.triggerClose(4409);
            vi.advanceTimersByTime(30000);
        });

        expect(MockWebSocket.instance).toBe(socket);

        vi.useRealTimers();
    });

    test('ignora eventos de un socket reemplazado', () => {
        const onMessage = vi.fn();
        const authExpired = vi.fn();
        window.addEventListener('auth:expired', authExpired);

        const { rerender, unmount } = renderHook(
            ({ url }) => useWebSocket(url, { onMessage, reconnect: false }),
            { initialProps: { url: 'ws://localhost:8000/ws/one' } }
        );
        const firstSocket = MockWebSocket.instance;

        rerender({ url: 'ws://localhost:8000/ws/two' });
        const secondSocket = MockWebSocket.instance;

        act(() => {
            firstSocket.triggerMessage({ type: 'stale' });
            firstSocket.triggerClose(4401);
        });

        expect(firstSocket).not.toBe(secondSocket);
        expect(onMessage).not.toHaveBeenCalled();
        expect(authExpired).not.toHaveBeenCalled();

        window.removeEventListener('auth:expired', authExpired);
        unmount();
    });

    test('no ejecuta onMessage cuando el mensaje no es JSON válido', () => {
        const onMessage = vi.fn();
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderHook(() => useWebSocket('ws://localhost:8000/ws', { onMessage }));

        act(() => {
            MockWebSocket.instance.triggerRawMessage('{ mensaje inválido');
        });

        expect(onMessage).not.toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith(
            'Mensaje WS inválido:',
            expect.any(SyntaxError)
        );

        errorSpy.mockRestore();
    });

    test('deja de reintentar después de diez reconexiones consecutivas', () => {
        vi.useFakeTimers();
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

        renderHook(() => useWebSocket('ws://localhost:8000/ws', { reconnect: true }));

        for (let attempt = 0; attempt < 11; attempt += 1) {
            act(() => {
                MockWebSocket.instance.triggerClose(1006);
                vi.advanceTimersByTime(30000);
            });
        }

        expect(MockWebSocket.instance.url).toBe('ws://localhost:8000/ws');
        expect(MockWebSocket.instance).toBeDefined();

        randomSpy.mockRestore();
        vi.useRealTimers();
    });
});

describe("useToast", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("comienza sin una notificación", () => {
        const { result } = renderHook(() => useToast());

        expect(result.current.toast).toBeNull();
    });

    it("muestra una notificación al ejecutar showToast", () => {
        const { result } = renderHook(() => useToast());

        act(() => {
        result.current.showToast();
        });

        expect(result.current.toast).toEqual({
        id: expect.any(Number),
        });
    });

    it("oculta la notificación al ejecutar hideToast", () => {
        const { result } = renderHook(() => useToast());

        act(() => {
        result.current.showToast();
        });

        expect(result.current.toast).not.toBeNull();

        act(() => {
        result.current.hideToast();
        });

        expect(result.current.toast).toBeNull();
    });

    it("oculta automáticamente la notificación después del tiempo indicado", () => {
        const { result } = renderHook(() => useToast(4000));

        act(() => {
        result.current.showToast();
        });

        expect(result.current.toast).not.toBeNull();

        act(() => {
        vi.advanceTimersByTime(3999);
        });

        expect(result.current.toast).not.toBeNull();

        act(() => {
        vi.advanceTimersByTime(1);
        });

        expect(result.current.toast).toBeNull();
    });

    it("permite configurar una duración diferente", () => {
        const { result } = renderHook(() => useToast(1000));

        act(() => {
        result.current.showToast();
        });

        act(() => {
        vi.advanceTimersByTime(999);
        });

        expect(result.current.toast).not.toBeNull();

        act(() => {
        vi.advanceTimersByTime(1);
        });

        expect(result.current.toast).toBeNull();
    });

    it("reinicia el temporizador cuando se muestra otra notificación", () => {
        const { result } = renderHook(() => useToast(4000));

        act(() => {
        result.current.showToast();
        });

        act(() => {
        vi.advanceTimersByTime(3000);
        });

        act(() => {
        result.current.showToast();
        });

        act(() => {
        vi.advanceTimersByTime(3000);
        });

        expect(result.current.toast).not.toBeNull();

        act(() => {
        vi.advanceTimersByTime(1000);
        });

        expect(result.current.toast).toBeNull();
    });
});