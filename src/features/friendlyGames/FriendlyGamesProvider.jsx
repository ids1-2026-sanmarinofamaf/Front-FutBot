import { createContext, useContext, useState, useCallback, useEffect } from "react";
import useWebSocket from "../../shared/hooks";

const WS_BASE_URL = import.meta.env.VITE_WS_SESSION_URL;

{/** "canal" por el que el provider comparte datos y funciones 
    con cualquier componente hijo. */}
const FriendlyGamesSocketContext = createContext(null);

const STORAGE_IDS = "fgIds";

const loadIds = () => {
    try {
        {/** Se usa sessionStorage para que cada pestaña maneje sus sockets separadamente */}
        return JSON.parse(sessionStorage.getItem(STORAGE_IDS) || "[]");
    } catch {
        return [];
    }
};

{/**  Un componente por partido: su vida = la vida de la conexión 
        el websocket se cierra solo si el servidor devuelve 
        4404 (not found) o 1000 (cierre exitoso)
    */}
function FGSocket({ friendly_game_id, onMessage, onFGGone }) {
    useWebSocket(`${WS_BASE_URL}/ws/friendly_game/${friendly_game_id}`, {
        onMessage: (msg) => onMessage(friendly_game_id, msg),
        onClose: (e) => { if (e.code === 4404 || e.code === 1000) onFGGone(friendly_game_id)}
    });
    return null;
}

export function FriendlyGamesSocketProvider({ children }) {
    const [FGIds, setFGIds] = useState(loadIds); /** Guarda IDs para que luego se creen conexiones ws */
    const [messages, setMessages] = useState({}); /** <- IMPORTANTE */

    // Cada vez que cambia la lista, se guarda (incluye leaveFG y leaveAll)
    useEffect(() => {
        sessionStorage.setItem(STORAGE_IDS, JSON.stringify(FGIds));
    }, [FGIds]);

    {/** Agrega id sin duplicar para que sean montados por FGSocket */}
    const joinFG = useCallback(
        (id) => setFGIds((ids) => (ids.includes(id) ? ids : [...ids, id])),
        []
    );

    {/** Quita el id y se desmonta  */}
    const leaveFG = useCallback(
        (id) => setFGIds((ids) => ids.filter((i) => i !== id)),
        []
    );

    {/** Vacia lista de id y cierra todo  */}
    const leaveAll = useCallback(() => {
        setFGIds([]);
        setMessages({});
    }, []);

    {/** Cierra todo cuando la sesión expira, relacion con apiClient */}
    useEffect(() => {
        window.addEventListener("auth:expired", leaveAll);
        return () => window.removeEventListener("auth:expired", leaveAll);
    }, [leaveAll]);

    {/** agrega el mensaje al array del partido correspondiente, 
        sin tocar los de otros partidos. */}
    const handleMessage = useCallback(
        (id, msg) =>
        setMessages((m) => ({ ...m, [id]: [...(m[id] ?? []), msg] })),
        []
    );

    /** El map crea los websockets viendo los ids guardados */
    return (
        <FriendlyGamesSocketContext.Provider value={{ messages, joinFG, leaveFG, leaveAll }}>
        {FGIds.map((id) => (
            <FGSocket key={id} friendly_game_id={id} onMessage={handleMessage} onFGGone={leaveFG} />
            ))}
        {children}
        </FriendlyGamesSocketContext.Provider>
    );
}

export const useFriendlyGamesSocket = () => useContext(FriendlyGamesSocketContext);