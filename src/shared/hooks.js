import { useRef, useCallback, useEffect } from 'react';

// https://websocket.org/guides/frameworks/react/#custom-hook-usewebsocket

function useWebSocket(url, options = {}) {
    const { onMessage, onOpen, onClose, reconnect = true } = options;

    //conservar mismo objeto entre renders sin provocar un nuevo render cuando cambia.
    const wsRef = useRef(null);

    const reconnectTimer = useRef(null);
    const attemptRef = useRef(0); //intentos de reconexión

    //React crea funciones nuevas en cada render. useCallback permite mantener 
    //una referencia estable a la función mientras sus dependencias no cambien.
    const connect = useCallback(() => {

        const socket = new WebSocket(url);
        wsRef.current = socket;

        socket.onopen = () => {
            attemptRef.current = 0; 
            onOpen?.(); 
        };

        socket.onmessage = (event) => {
            onMessage?.(JSON.parse(event.data)); //ver
        };

        socket.onclose = (event) => {
            onClose?.(event);
            if (reconnect && event.code !== 1000) { //1000 significa que la conexión se cerró normalmente
                scheduleReconnect();
            }
        };

        socket.onerror = () => {
            console.log("Se produjo un error al conectar con ws")
            socket.close();}
        }, [url, onMessage, onOpen, onClose, reconnect]);

    const scheduleReconnect = useCallback(() => {
        const attempt = attemptRef.current;
        if (attempt >= 10) return; // stop after 10 attempts

        const baseDelay = Math.min(1000 * 2 ** attempt, 30000); //exponential backoff
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        reconnectTimer.current = setTimeout(() => {
            attemptRef.current += 1;
            connect();
        }, delay);
    }, [connect]);

    
    useEffect(() => {
        if (!url) return;

        connect();

        return () => {
            clearTimeout(reconnectTimer.current);
            wsRef.current?.close(1000, "hook cleanup");
        };
    }, [connect]);

    //permite que el componente mande información al backend
    const send = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    }, []);

    return { send, wsRef };

} export default useWebSocket;
