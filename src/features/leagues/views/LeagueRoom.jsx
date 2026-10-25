import { useParams } from "react-router-dom";
import { useToast } from "../../../shared/hooks";
import { useLeaguesSocket } from "../LeaguesProvider"
import { getCurrentUser } from "../../friendlyGames/api";
import { useMemo } from "react";

/**
 * Integración de componenetes:
 * - Información de liga
 * - Lista de participantes
 * - Mock de fixture
 * - Mock de tabla de puntaje 
 */
export function LeagueLobby() {

  // Hook para leer parametros
  const { id } = useParams();
  const numericId = Number(id);

  // Hook para manejar estados recibidos por el websocket
  const { messages, joinL, leaveL, joinedLIds } = useLeaguesSocket();
  // Hook para mostrar notificaciones  
  const { toast, showToast, hideToast } = useToast();

  /** 
   * Capturamos si el ID ya estaba en joinedFGIds en el primer render (antes del efecto de joinFG):
   * - Si estaba → el usuario llegó por la UI (FGCard llamó joinFG antes de navegar).
   * - Si no estaba → el usuario escribió la URL directamente → acceso no permitido.
  */
  const wasAlreadyJoined = useRef(
    joinedLIds.some((i) => Number(i) === numericId)
  );

  // Protección de acceso temprana: antes de conectar el WebSocket,  si el usuario llegó por URL directa (no pasó por la UI) redirigir de inmediato.
  useEffect(() => {
    if (!wasAlreadyJoined.current) {
      navigate("/league", { replace: true });
    }
  }, []);

  const [localUserName, setLocalUserName] = useState(null);

  // 1. Inicialización (solo si el acceso es legítimo)
  useEffect(() => {
    if (!wasAlreadyJoined.current) return;
    if (isNaN(numericId)) return;
    joinL(numericId);

    const fetchIdentity = async () => {
      try {
        const userData = await getCurrentUser();
        setLocalUserName(userData.user_name);
      } catch (err) {
        //VER SI PONER ALERTA TOAST
        console.error("Error al obtener identidad:", err);
      }
    };
    fetchIdentity();
  }, [numericId, joinL]);

  /**
   * 2. Procesamiento de un evento
   * @param {*} lobby : 
   * @param {*} msg : mensaje a procesar
   * @returns Lista actualizada de acuerdo al evento procesado
   */
  function applyLeagueEvent(lobby, msg) {
    switch (msg.type) {
      case "lobby_state": // foto completa: reemplaza todo
        return { ready: true, state: msg.state, users: msg.users };

      case "user_joined": // cambio: se aplica sobre lo anterior
        if (!lobby.ready) return lobby; // llegó antes del lobby_state: se descarta
        if (lobby.users.some((u) => u.club_id === msg.user.club_id)) return lobby; // duplicado
        return { ...lobby, users: [...lobby.users, msg.user] };

      case "user_left":
        if (!lobby.ready) return lobby;
        return { ...lobby, users: lobby.users.filter((u) => u.club_id !== msg.user.club_id) };

      default:
        return lobby;
    }
  }

  /**
   * 2.1 Procesamientos de eventos 
   * 
   * Se utiliza el hook `useMemo` para guardar el resultado de la función y **solo lo vuelve a calcular cuando cambian sus dependencias**.
   * 
   * Se utiliza `reduce` para recorrer la lista de eventos y acumular los resultados de cada aplicación de `applyLeagueEvent`
   * 
   * @returns booleano para activar/descativar funcionalidades de UI 
   * @returns estado de la liga 
   * @returns lista de usuarios (cada uno con sus detalles)
   */
  const lobby = useMemo(() => {
    const events = messages[numericId] || [];
    return events.reduce(applyLeagueEvent, { ready: false, state: null, users: [] }); // reduce llama al callback con (acumulador, elementoActual), acá son (lobby, msg)
  }, [messages, numericId]);

  return({

  })
}