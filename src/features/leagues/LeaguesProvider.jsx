import { createContext, useContext, useState, useCallback, useEffect } from "react";
import useWebSocket from "../../shared/hooks";
import { getToken } from "../auth/auth";

const WS_BASE_URL = import.meta.env.VITE_WS_SESSION_URL;

{/** "canal" por el que el provider comparte datos y funciones
    con cualquier componente hijo. */}
const LeaguesSocketContext = createContext(null);

const STORAGE_IDS = "lIds";
const isValidLeagueId = (id) => Number.isInteger(id) && id > 0;

const loadIds = () => {
    try {
        {/** Se usa sessionStorage para que cada pestaña maneje sus sockets separadamente */}
        const storedIds = JSON.parse(sessionStorage.getItem(STORAGE_IDS) || "[]");

        if (!Array.isArray(storedIds)) return [];

        return [...new Set(storedIds.filter(isValidLeagueId))];
    } catch {
        return [];
    }
};

{/** Un componente por liga: su vida = la vida de la conexión.
    El websocket se cierra solo si el servidor devuelve
    4404 (no existe), 4403 (el usuario no participa),
    4409 (liga no disponible) o 1000 (cierre exitoso)
    */}
function LSocket({ id_liga, onMessage, onLGone }) {
    const token = getToken();
    useWebSocket(`${WS_BASE_URL}/ws/league/${id_liga}?token=${token}`, {
        onMessage: (msg) => onMessage(id_liga, msg),
        onClose: (e) => {
            // Estos códigos indican que la liga ya no debe mantenerse abierta.
            // Al quitarla del provider también se elimina de sessionStorage.
            if (e.code === 4404 || e.code === 4403 || e.code === 4409 || e.code === 1000) {
                onLGone(id_liga);
            }
        }
    });
    return null;
}

export function LeaguesSocketProvider({ children }) {
    const [LIds, setLIds] = useState(loadIds); /** Guarda IDs para que luego se creen conexiones ws */
    const [messages, setMessages] = useState({}); /** <- IMPORTANTE */

    // Cada vez que cambia la lista, se guarda (incluye leaveL y leaveAll)
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_IDS, JSON.stringify(LIds));
        } catch {
            // La conexión actual no debe fallar si el storage está bloqueado o lleno.
        }
    }, [LIds]);

    {/** Agrega id sin duplicar para que sean montados por LSocket */}
    const joinL = useCallback(
        (id) => setLIds((ids) => {
            if (!isValidLeagueId(id) || ids.includes(id)) return ids;
            return [...ids, id];
        }),
        []
    );

    {/** Quita el id y se desmonta */}
    const leaveL = useCallback(
        (id) => setLIds((ids) => ids.filter((i) => i !== id)),
        []
    );

    {/** Vacía la lista de ids y cierra todo */}
    const leaveAll = useCallback(() => {
        setLIds([]);
        setMessages({});
    }, []);

    {/** Cierra todo cuando la sesión expira, relación con apiClient */}
    useEffect(() => {
        window.addEventListener("auth:expired", leaveAll);
        window.addEventListener("auth:logout", leaveAll);
        return () => {
            window.removeEventListener("auth:expired", leaveAll);
            window.removeEventListener("auth:logout", leaveAll);
        };
    }, [leaveAll]);

    {/** Agrega el mensaje al array de la liga correspondiente,
        sin tocar los de otras ligas. */}
    const handleMessage = useCallback(
        (id, msg) =>
        setMessages((m) => ({ ...m, [id]: [...(m[id] ?? []), msg] })),
        []
    );

    /** El map crea los websockets viendo los ids guardados */
    return (
        <LeaguesSocketContext.Provider value={{
            messages,
            joinedLIds: LIds,
            joinL,
            leaveL,
            leaveAll
        }}>
        {LIds.map((id) => (
            <LSocket key={id} id_liga={id} onMessage={handleMessage} onLGone={leaveL} />
            ))}
        {children}
        </LeaguesSocketContext.Provider>
    );
}

export const useLeaguesSocket = () => useContext(LeaguesSocketContext);

