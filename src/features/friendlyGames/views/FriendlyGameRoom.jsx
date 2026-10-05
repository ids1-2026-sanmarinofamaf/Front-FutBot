import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFriendlyGamesSocket } from "../FriendlyGamesProvider";
import { getCurrentUser, startFriendlyGame } from "../api";
import { useToast } from "../../../shared/hooks";
import RightDownAlert from "../../../shared/components/RightDownAlert";
import { JoinMatchButton } from "../components/JoinMatchButton";

export function FriendlyGameRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numericId = Number(id);

  const { messages, joinFG } = useFriendlyGamesSocket();
  const { toast, showToast, hideToast } = useToast();
  
  const [localUserName, setLocalUserName] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Inicialización
  useEffect(() => {
    if (isNaN(numericId)) return;
    joinFG(numericId);

    const fetchIdentity = async () => {
      try {
        const userData = await getCurrentUser();
        setLocalUserName(userData.user_name);
      } catch (err) {
        console.error("Error al obtener identidad:", err);
      }
    };
    fetchIdentity();
  }, [numericId, joinFG]);

  // 2. Procesamiento del estado
  const roomState = useMemo(() => {
    const roomMessages = messages[numericId] || [];
    if (roomMessages.length === 0) return null;
    return roomMessages[roomMessages.length - 1];
  }, [messages, numericId]);

  const creator = roomState?.users?.find(u => u.is_creator) || roomState?.users?.[0] || null;
  const opponent = roomState?.users?.find(u => u.is_creator === false) || roomState?.users?.[1] || null;
  
  const isLocalUserCreator = localUserName && creator && localUserName === creator.user_name;
  // NUEVO: Verificamos si es el oponente
  const isLocalUserOpponent = localUserName && opponent && localUserName === opponent.user_name;
  // NUEVO: Bandera combinada para saber si el usuario que mira es uno de los jugadores
  const isParticipant = isLocalUserCreator || isLocalUserOpponent;
  
  const isMatchReady = roomState?.state === "JUGANDO" || roomState?.match_id != null;

  // 3. Handlers
  const handleStartMatch = async () => {
    if (!opponent) return;
    setIsStarting(true);
    hideToast();
    
    try {
      await startFriendlyGame(numericId);
    } catch (error) {
      setErrorMsg("Fallo al iniciar el partido.");
      showToast();
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center py-12 px-4 sm:px-8">
      <div className="w-full max-w-5xl bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 sm:p-10">
        
        {/* Encabezado con navegación */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b border-slate-700 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/friendly")}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors shadow-md"
            >
              Volver
            </button>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 uppercase tracking-wider">
              Lobby
            </h1>
          </div>
          <span className="text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded border border-slate-700 shadow-inner">
            ID: {numericId}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          
          <div className="bg-slate-900 border-2 border-blue-500/30 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <h3 className="text-blue-400 text-sm font-bold uppercase tracking-widest mb-4">Creador</h3>
            {creator ? (
              <div className="text-center">
                <p className="text-2xl text-slate-100 font-bold">{creator.user_name}</p>
                {localUserName === creator.user_name && (
                  <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded mt-2 inline-block">Tú</span>
                )}
              </div>
            ) : (
              <span className="text-slate-500 font-mono animate-pulse">Sincronizando...</span>
            )}
          </div>

          <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-widest mb-4">Oponente</h3>
            {opponent ? (
              <div className="text-center">
                <p className="text-2xl text-slate-100 font-bold">{opponent.user_name}</p>
                {localUserName === opponent.user_name && (
                  <span className="text-xs bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded mt-2 inline-block">Tú</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
                <span className="text-slate-400 font-mono text-sm">Esperando contrincante...</span>
              </div>
            )}
          </div>
        </div>

        {/* Renderizado condicional de acciones basado en el estado del partido */}
        <div className="flex justify-end items-center mt-8 pt-6 border-t border-slate-700 min-h-[60px]">
          {isMatchReady ? (
            isParticipant ? (
              <JoinMatchButton matchId={roomState.match_id} />
            ) : (
              <span className="px-6 py-2 bg-slate-700 text-slate-300 rounded font-semibold animate-pulse">
                Modo Espectador
              </span>
            )
          ) : (
            isLocalUserCreator && (
              <button 
                onClick={handleStartMatch}
                disabled={!opponent || isStarting}
                className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-lg transition-colors disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed shadow-lg flex justify-center items-center gap-2"
              >
                {isStarting ? "INICIANDO..." : "INICIAR PARTIDO"}
              </button>
            )
          )}
        </div>

      </div>

      {errorMsg && toast && (
        <RightDownAlert
            key={toast.id}
            toast={toast}
            errorTitle="Error"
            errorDescription={errorMsg}
            color="red"
        />
      )}
    </div>
  );
}