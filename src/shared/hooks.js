import { useRef, useCallback, useEffect } from 'react';

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
                
                //crea evento para notificar que se debe cerrar la sesión
                if (event.code === 4401) {
                    window.dispatchEvent(new Event("auth:expired"));
                }

                if (wsRef.current !== socket) return; // socket descartado
                onCloseRef.current?.(event);

                if (
                reconnect &&
                shouldReconnectRef.current &&
                event.code !== 1000 &&
                attemptRef.current < 10
                ) {
                    const baseDelay = Math.min(1000 * 2 ** attemptRef.current, 30000);
                    const delay = baseDelay + Math.random() * 1000;

                    reconnectTimer.current = setTimeout(() => {
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

export default useWebSocket;