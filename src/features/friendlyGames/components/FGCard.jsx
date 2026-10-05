import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../shared/hooks";
import { joinFGAsPlayer } from "../api"
import { useFriendlyGamesSocket } from "../FriendlyGamesProvider"
import RightDownAlert from "../../../shared/components/RightDownAlert";

export function FGCard ({game, roster}) {
    const rosterLoaded = roster?.players?.length === 6;

    {/** Manejo de conexiónes websocket */}
    const socket = useFriendlyGamesSocket();
    const joinFG = socket?.joinFG;
    const joinedFGIds = socket?.joinedFGIds ?? []; // ?. para evitar error si se usa fuera del context

    {/** Navegación */}
    const navigate = useNavigate();
    
    {/** Alertas */}
    const[alert,setAlert] = useState(null)
    const {toast,showToast,hideToast} = useToast();

    {/** Recuperación de IDs de partidos amistosos unidos */}
    const [joinedAfterRecovery, setJoinedAfterRecovery] = useState(false);
    const hasJoined = joinedAfterRecovery || joinedFGIds.includes(game.friendly_game_id);
    
    const handleJoin = async () => {
        setAlert("")
        hideToast();
        try{
            await joinFGAsPlayer(game.friendly_game_id, roster);

            // Solo se abre el WebSocket si el endpoint confirmó la unión.
            joinFG?.(game.friendly_game_id);
            setJoinedAfterRecovery(true);
            setAlert("Ya puedes ir al lobby");
            showToast();

        }catch(err){
            if (err.code === "ALREADY_PARTICIPATING") {
                // Recupera el ID perdido y vuelve a abrir el WebSocket.
                joinFG?.(game.friendly_game_id);
                setJoinedAfterRecovery(true);
                setAlert("Ya participabas, puedes ir al lobby");
                showToast();
                return;
            }

            if (err.code === "FULL") {
                // Recupera el ID perdido y vuelve a abrir el WebSocket.
                setAlert("Pruebe otro partido amistoso");
                showToast();
                return;
            }


            console.error("No se pudo unir al partido amistoso:", err);
            setAlert("Error al unirse, intente en otro momento.");
            showToast();
        }
    }

    {/** PROXIMO SPRINT
        const handleSpectator = () => {
            try{
            }catch(err){
                
        }
    }
    */}


    return(
    <div className="h-full p-4 bg-slate-800 border border-slate-700 rounded-lg flex justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">

            <span className="text-lg font-medium text-slate-200">
                Creador: {game.creator_club_name}
            </span>
            <span className="text-lg font-medium text-slate-200">
                Jugadores actuales: {game.current_participants} de {game.capacity}
            </span>
            <span className="text-lg font-medium text-slate-200">
                estado: {game.state} 
            </span>

        </div>
        
        {/** Alerta: Error al usar apiClient */}
        {alert === "Error al unirse, intente en otro momento." && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="No se pudo enviar solicitud al servidor"
                errorDescription={alert}
                color="red"
            />
        )}

        {/** Alerta: Unirse correctamente */}
        {alert === "Ya puedes ir al lobby" && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="Te uniste correctamente"
                errorDescription={alert}
                color="green"
            />
        )}

        {/** Alerta: Unirse a fg lleno */}
        {alert === "Pruebe otro partido amistoso" && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="El amistoso está lleno"
                errorDescription={alert}
                color="orange"
            />
        )}

        {/** Alerta: Unirse correctamente cuando ya pertenecias */}
        {alert === "Ya participabas, puedes ir al lobby" && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="Te uniste correctamente"
                errorDescription={alert}
                color="orange"
            />
        )}
        
        <div className="flex gap-2">

            {/** PROXIMO SPRINT
            <button 
            onClick={handleSpectator}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors"
            >
                Espectador
            </button>
            */}

            {/** BLOQUEAR SI EL ESTADO ES JUGANDO Y NO ESTAS UNIDO
             * DESHABILITAR OPCION DE UNIRSE SI NO HAY PLANTILLA CARGADA 
             */}
            <button
            disabled={!hasJoined && !rosterLoaded}
            onClick={() => hasJoined
                ? navigate(`/friendly/lobby/${game.friendly_game_id}`)
                : handleJoin()
            }
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-700"
            >
                {hasJoined ? "Entrar al lobby" : "Unirse"}
            </button>

        </div>
    </div>
    )
} 
