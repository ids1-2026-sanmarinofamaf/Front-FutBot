import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "../../shared/hooks.js";
import { getToken } from "../auth/auth.js";
import { Match } from "./views/Match";
import { useAnimatedMatchState } from "./useAnimatedMatchState.js";
import { ExitMatchButton } from "./components/ExitMatchButton";

const WS_BASE_URL = import.meta.env.VITE_WS_SESSION_URL;

/**
 * Componente principal de la página de partido.
 * Gestiona la conexión WebSocket con el servidor enviando el token de autenticación (si existe),
 * almacena la información estática del encuentro (`match_info`), el estado en tiempo real (`estado_partido`),
 * los eventos de pausa y delega el renderizado en la vista `Match`.
 *
 * @returns {JSX.Element}
 */
export function MatchPage() {
  const { matchId } = useParams();

  const [matchInfo, setMatchInfo] = useState(null);
  const [estadoPartido, setEstadoPartido] = useState(null);
  const [pausa, setPausa] = useState(null);
  const [ventanaSustitucionesAbierta, setVentanaSustitucionesAbierta] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [penalties, setPenalties] = useState(null);

  const handleMessage = useCallback(function (data) {
    switch (data.event) {
      case "match_info":
        setMatchInfo(data);
        break;

      case "pause_started":
        setPausa(data);
        setVentanaSustitucionesAbierta(true);
        break;

      case "substitution_window_closed":
        setVentanaSustitucionesAbierta(false);
        break;

      case "pause_finished":
        setPausa(null);
        setVentanaSustitucionesAbierta(false);
        break;

      case "coach_changes":
      case "coach_change":
        if (data.changes && Array.isArray(data.changes)) {
          setEstadoPartido(function (previous) {
            if (!previous) return previous;
            const updatedPlayers = previous.players.map(function (player) {
              const change = data.changes.find(
                (c) => String(c.player_id) === String(player.player_id)
              );
              return change
                ? { ...player, current_behavior_name: change.behavior_name }
                : player;
            });
            return { ...previous, players: updatedPlayers };
          });
        }
        break;

      case "estado_partido":
        setEstadoPartido(data);
        if (data.substitution_window_open !== undefined) {
          setVentanaSustitucionesAbierta(Boolean(data.substitution_window_open));
        }
        break;

      case "penalty_shootout_started":
        setPenalties(
          {
            phase: "intro",
            data,
            results: [],
          }
        );
        break;

      case "penalty_history":
        setPenalties({
          phase: "waiting",
          data: null,
          results: data.results,
        });
        break;

      case "penalty_turn_started":
        setPenalties(function (previous) {
          return {
            phase: "choosing",
            data,
            results: previous?.results ?? [],
          };
        });
        break;

      case "penalty_result":
        setPenalties(function (previous) {
          const results = previous?.results ?? [];

          const otherResults = results.filter(function (result) {
            return result.turn !== data.turn;
          });

          return {
            phase: "result",
            data,
            results: [... otherResults, data],
          };
        });
        break;

      case "penalty_shootout_finished":
        setPenalties(function (previous) {
          return {
            phase: "finished",
            data,
            results: previous?.results ?? [],
          };
        });
        break;

      default:
        // Compatibilidad con estados que llegan sin campo event.
        if (data.actual_tic !== undefined) {
          setEstadoPartido(data);
        } else {
          console.warn("Evento WebSocket desconocido:", data);
        }
    }
  }, []);

  const handleClose = useCallback(function (event) {
    if (event.code === 4404) {
      setErrorMessage("El partido no existe");
    }

    if (event.code === 1000) {
      console.log("El partido finalizó");
    }

    console.log("Conexión del partido cerrada:", event);
  }, []);

  const token = getToken();
  const url = matchId
    ? `${WS_BASE_URL}/ws/matches/${matchId}${token ? `?token=${token}` : ""}`
    : null;

  useWebSocket(url, {
    onMessage: handleMessage,
    onClose: handleClose,
  });

  const estadoAnimado = useAnimatedMatchState(estadoPartido);

  if (errorMessage) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-900 p-8">
        <div className="w-full max-w-3xl px-12 py-16 bg-slate-800 border border-slate-700 rounded-xl shadow-lg text-center">
          <h2 className="text-5xl font-semibold text-slate-100">{errorMessage}</h2>
          <p className="mt-6 text-2xl text-slate-400">
            Presioná «Salir del partido» (abajo a la izquierda) para volver.
          </p>
        </div>
        <ExitMatchButton />
      </div>
    );
  }

  if (!estadoAnimado) {
    return <p>Conectando al partido...</p>;
  }

  return (
    <Match
      matchId={matchId}
      estado_partido={estadoAnimado}
      matchInfo={matchInfo}
      pausa={pausa}
      ventanaSustitucionesAbierta={ventanaSustitucionesAbierta}
      penalties={penalties}
    />
  );
}