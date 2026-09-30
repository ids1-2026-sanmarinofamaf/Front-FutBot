import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import useWebSocket from './hooks';

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
});
