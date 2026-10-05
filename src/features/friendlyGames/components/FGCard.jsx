import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../shared/hooks";
import { joinFGAsPlayer } from "../api";
import { useFriendlyGamesSocket } from "../FriendlyGamesProvider";
import RightDownAlert from "../../../shared/components/RightDownAlert";

export function FGCard({ game, roster }) {
    const rosterLoaded = roster?.players?.length === 6;
    const socket = useFriendlyGamesSocket();
    const joinFG = socket?.joinFG;
    const joinedFGIds = socket?.joinedFGIds ?? [];
    const navigate = useNavigate();
    const [alert, setAlert] = useState(null);
    const { toast, showToast, hideToast } = useToast();

    const [joinedAfterRecovery, setJoinedAfterRecovery] = useState(false);
    const hasJoined = joinedAfterRecovery || joinedFGIds.includes(game.friendly_game_id);
    
    const isFull = game.current_participants >= game.capacity;
    const isPlaying = game.state === "JUGANDO";

    const handleJoin = async () => {
        setAlert("");
        hideToast();

        // 1. Si ya estamos unidos o el partido está JUGANDO, navegamos sin hacer POST
        if (hasJoined || isPlaying) {
            navigate(`/friendly/lobby/${game.friendly_game_id}`);
            return;
        }

        // 2. Si está POR_COMENZAR, necesitamos plantilla
        if (!rosterLoaded) {
            setAlert("Debe cargar una plantilla primero");
            showToast();
            return;
        }

        // 3. Intentamos unirnos a un partido POR_COMENZAR
        try {
            await joinFGAsPlayer(game.friendly_game_id, roster);
            joinFG?.(game.friendly_game_id);
            setJoinedAfterRecovery(true);
            navigate(`/friendly/lobby/${game.friendly_game_id}`);
        } catch(err) {
            if (err.code === "ALREADY_PARTICIPATING") {
                joinFG?.(game.friendly_game_id);
                setJoinedAfterRecovery(true);
                navigate(`/friendly/lobby/${game.friendly_game_id}`);
                return;
            }

            if (err.code === "FULL") {
                setAlert("El partido amistoso está lleno");
                showToast();
                return;
            }
            
            if (err.message === "Friendly game is not available") {
                 // Por si justo alguien le dio "Iniciar" un milisegundo antes
                 navigate(`/friendly/lobby/${game.friendly_game_id}`);
                 return;
            }

            setAlert("Error al unirse, intente en otro momento.");
            showToast();
        }
    }

    // Se deshabilita si NO estamos jugando, NO estamos unidos y NO hay plantilla
    const isButtonDisabled = !hasJoined && !isPlaying && !rosterLoaded;

    return (
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
            
            {alert && toast && (
                <RightDownAlert 
                    key={toast.id} 
                    toast={toast} 
                    errorTitle="Aviso" 
                    errorDescription={alert} 
                    color={alert.includes("plantilla") || alert.includes("lleno") ? "orange" : "red"}
                />
            )}
            
            <div className="flex gap-2">
                <button
                    disabled={isButtonDisabled}
                    onClick={handleJoin}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {hasJoined ? "Entrar al lobby" : (isPlaying ? "Reconectar / Ver" : "Unirse")}
                </button>
            </div>
        </div>
    )
}