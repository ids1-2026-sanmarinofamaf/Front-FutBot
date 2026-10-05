import { useRef, useCallback, useEffect, useState } from 'react';

function useWebSocket(url, options = {}) {
    const { onMessage, onOpen, onClose, reconnect = true } = options;

    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const attemptRef = useRef(0);
    const shouldReconnectRef = useRef(true);

    // Callbacks siempre actualizados, sin recrear la conexión
    const onMessageRef = useRef(onMessage);
    const onOpenRef = useRef(onOpen);
    const onCloseRef = useRef(onClose);


    //se usan referencias para que cada renderizado no cierre/abra el socket
    useEffect(() => {
        onMessageRef.current = onMessage;
        onOpenRef.current = onOpen;
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!url) return;

        //Solo se reconecta si cambia la URL o la opción reconnect
        shouldReconnectRef.current = true;
        attemptRef.current = 0;

        const connect = () => {
            if (!shouldReconnectRef.current) return;

            // Una URL no puede tener dos sockets vivos administrados por este hook.
            // Esto también evita duplicados si se dispara más de un reintento.
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
            const previousSocket = wsRef.current;
            wsRef.current = null;
            previousSocket?.close(1000, "replaced by reconnect");

            const socket = new WebSocket(url);
            wsRef.current = socket;

            socket.onopen = () => {
                if (wsRef.current !== socket) return;
                attemptRef.current = 0;
                onOpenRef.current?.();
            };

            socket.onmessage = (event) => {
                if (wsRef.current !== socket) return;

                try {
                    onMessageRef.current?.(JSON.parse(event.data));
                } catch (err) {
                    console.error("Mensaje WS inválido:", err);
                }
            };

            socket.onerror = () => {
                console.error("Se produjo un error al conectar con ws");
                // el navegador dispara onclose después de onerror
            };

            socket.onclose = (event) => {
                // Un socket reemplazado no puede afectar la conexión actual.
                if (wsRef.current !== socket) return;

                // El socket ya no es el actual mientras espera una reconexión.
                // Así, otro cierre tardío no puede programar otra conexión.
                wsRef.current = null;

                //crea evento para notificar que se debe cerrar la sesión
                if (event.code === 4401) {
                    window.dispatchEvent(new Event("auth:expired"));
                }

                onCloseRef.current?.(event);

                if (
                reconnect &&
                shouldReconnectRef.current &&
                event.code !== 1000 &&
                event.code !== 4409 &&
                attemptRef.current < 10 &&
                reconnectTimer.current === null
                ) {
                    const baseDelay = Math.min(1000 * 2 ** attemptRef.current, 30000);
                    const delay = baseDelay + Math.random() * 1000;

                    reconnectTimer.current = setTimeout(() => {
                        reconnectTimer.current = null;
                        attemptRef.current += 1;
                        connect();
                    }, delay);
                }
            };
        };

        connect();

        //clean up al desmontar o cambiar url (se reejecuta el efecto)
        return () => {
            shouldReconnectRef.current = false; //no debe reconectarse (cierre intencional).
            clearTimeout(reconnectTimer.current); //cancela reconexión programada.
            reconnectTimer.current = null;
            const socket = wsRef.current;
            wsRef.current = null; // los handlers viejos se ignoran
            socket?.close(1000, "hook cleanup");
        };

    }, [url, reconnect]);

    //función para mandar mensajes por el WebSocket
    //No util ahora, quizás en el futuro
    const send = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
            return true;
        }
        return false;
    }, []);

    return { send, wsRef };
}

export function useToast(duration = 4000) {
    const [toast, setToast] = useState(null);

    const showToast = useCallback(() => {
        setToast({ id: Date.now() });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast(null);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast, duration]);

    return {
        toast,
        showToast,
        hideToast,
    };
}

export default useWebSocket;
