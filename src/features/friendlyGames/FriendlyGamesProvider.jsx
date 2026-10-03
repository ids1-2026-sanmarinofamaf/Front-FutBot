import { createContext, useContext, useState, useCallback } from "react";
import useWebSocket from "../../shared/hooks";

const WS_BASE_URL = import.meta.env.VITE_WS_SESSION_URL;

{/** "canal" por el que el provider comparte datos y funciones 
    con cualquier componente hijo. */}
const FriendlyGamesSocketContext = createContext(null);

{/**  Un componente por partido: su vida = la vida de la conexión */}
function FGSocket({ friendly_game_id, onMessage }) {
    useWebSocket(`${WS_BASE_URL}/ws/friendly_game/${friendly_game_id}`, {
        onMessage: (msg) => onMessage(friendly_game_id, msg),
    });
    return null;
}

export function FriendlyGamesSocketProvider({ children }) {
    const [FGIds, setFGIds] = useState([]); /** Guarda IDs para que luego se creen conexiones ws */
    const [messages, setMessages] = useState({}); /** <- IMPORTANTE */

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
            <FGSocket key={id} friendly_game_id={id} onMessage={handleMessage} />
            ))}
        {children}
        </FriendlyGamesSocketContext.Provider>
    );
}

export const useFriendlyGamesSocket = () => useContext(FriendlyGamesSocketContext);