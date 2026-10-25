import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../../shared/hooks";
import { useLeaguesSocket } from "../LeaguesProvider"
import { getCurrentUser } from "../../friendlyGames/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { LobbyUsers } from "../components/LobbyUsers";
/**
 * Integración de componenetes:
 * - Información de liga
 * - Lista de participantes
 * - Mock de fixture
 * - Mock de tabla de puntaje 
 */
export function LeagueLobby() {
  // Hook para leer parametros de la dirección
  const { id, leagueName } = useParams();
  const numericId = Number(id);

  // Hook para manejar estados recibidos por el websocket
  const { messages, joinL, leaveL, joinedLIds } = useLeaguesSocket();
  // Hook para mostrar notificaciones  
  const { toast, showToast, hideToast } = useToast();
  // Hook para navegación
  const navigate = useNavigate();

  /** 
   * Capturamos si el ID ya estaba en joinedFGIds en el primer render (antes del efecto de joinFG):
   * - Si estaba → el usuario llegó por la UI (FGCard llamó joinFG antes de navegar).
   * - Si no estaba → el usuario escribió la URL directamente → acceso no permitido.
  */
  const wasAlreadyJoined = useRef(
    joinedLIds.some((i) => Number(i) === numericId)
  );

  // Protección de acceso temprana: antes de conectar el WebSocket,  si el usuario llegó por URL directa (no pasó por la UI) redirigir de inmediato.
  // useEffect(() => {
  //   if (!wasAlreadyJoined.current) {
  //     navigate("/league", { replace: true });
  //   }
  // }, []);

  const [localUserName, setLocalUserName] = useState(null);

  // 1. Inicialización (solo si el acceso es legítimo)
  useEffect(() => {
    //if (!wasAlreadyJoined.current) return;
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
   * @param {*} lobby : información previa del lobby
   * @param {*} msg : mensaje a procesar
   * @returns Lista actualizada de acuerdo al evento procesado
   */
  function applyLeagueEvent(lobby, msg) {
    switch (msg.type) {
      case "lobby_state": // foto completa: reemplaza todo
        return {ready: true, 
                leagueID: msg.league_id, 
                currentUsers: msg.current_users, 
                state: msg.state, 
                users: msg.users 
              };

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

  const mockcurrent_users= 2
  const mockUsers = [
    {
      "club_id": 1,
      "user_name": "Club A",
      "avatar": "default",
      "is_creator": true
    },
    {
      "club_id": 2,
      "user_name": "Club B",
      "avatar": "default",
      "is_creator": false
    }
  ]

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
    return events.reduce(applyLeagueEvent, { ready: false, leagueID : id, currentUsers : mockcurrent_users , state: null, users: mockUsers }); // reduce llama al callback con (acumulador, elementoActual), acá son (lobby, msg)
  }, [messages, numericId]);

  const TABS = [
    { id: "usuarios", label: "Usuarios", disabled: false },
    { id: "fixture", label: "Fixture", disabled: true },
    { id: "tabla", label: "Tabla de posiciones", disabled: true },
  ];

  const [activeTab, setActiveTab] = useState("usuarios");

  return(
    <div className="leading-normal mi-fuente min-h-screen bg-slate-900 p-4 sm:p-8 max-w-7xl mx-auto space-y-6">

      {/* Componente: info de liga */}
      <div className="mx-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 sm:p-6">

        {/* Encabezado: Boton para volver a la lista de ligas, Info de liga y botones para ver componentes principales */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">

          {/* Boton para volver */}
          <button
            type="button"
            onClick={() => navigate("/league")}
            className="px-10 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors shadow-md"
          >
            Volver
          </button>

          {/* Nombre de liga y cantidad de jugadores */}
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-wider
                          text-transparent bg-clip-text
                          bg-gradient-to-r from-blue-400 to-emerald-400">
              {leagueName}
            </h1>
            <p className=" text-slate-400">
              Jugadores: {lobby.currentUsers}
            </p>
          </div>

          {/* Tabs */}
          <ul className="flex flex-wrap ml-auto">
            {TABS.map((tab) => (
              <li key={tab.id} className="me-2">
                <button
                  type="button"
                  disabled={tab.disabled}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-colors ${
                    tab.disabled
                      ? "border-transparent text-slate-600 cursor-not-allowed"
                      : activeTab === tab.id
                      ? "text-emerald-400 border-emerald-400"
                      : "border-transparent hover:text-emerald-400 hover:border-emerald-400/50"
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

        </div>

      </div>
      
      {/* Contenido */}
      <div className="max-w-6xl mx-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 sm:p-6">
        {activeTab === "usuarios" && <LobbyUsers users={lobby.users} />}
        {/* {activeTab === "fixture" && <FixtureTab />}
        {activeTab === "tabla" && <TablaTab />} */}
      </div>

    </div>
    

    //Los siguientes componentes principales ocupan toda la pantalla, se intercala entre ellos

      // Componente: lista de participantes

      // Componente: Fixture

      // Componente: Tabla de posiciones

  )
}