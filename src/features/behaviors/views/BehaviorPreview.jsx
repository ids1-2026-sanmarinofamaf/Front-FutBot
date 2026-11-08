import { useCallback, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useWebSocket from "../../../shared/hooks.js";
import { getToken } from "../../auth/auth.js";
import { SoccerField } from "../../match/views/SoccerField.jsx";
import { MatchPlayerInMatch } from "../../match/components/MatchPlayerInMatch.jsx";
import { Scoreboard } from "../../match/components/Scoreboard.jsx";
import { Ball } from "../../match/components/Ball.jsx";
import { useAnimatedMatchState } from "../../match/useAnimatedMatchState.js";
import { stopBehaviorPreview } from "../api.js";

const WS_BASE_URL = import.meta.env.VITE_WS_SESSION_URL;

const PREVIEW_PLAYER_NUMBERS = {
  1: 1,
  2: 2,
  3: 3,
  7: 1,
  8: 2,
  9: 3,
};

export function BehaviorPreview() {
  const { previewId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [estadoPartido, setEstadoPartido] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const handleMessage = useCallback(function (data) {
    if (data.event === "estado_partido") {
      setEstadoPartido(data);
    } else if (data.event === "preview_finished") {
      if (data.reason === "completed") {
        setIsFinished(true);
      }
    }
  }, []);

  const token = getToken();
  const url = previewId
    ? `${WS_BASE_URL}/ws/behaviors/previews/${previewId}${token ? `?token=${token}` : ""}`
    : null;

  useWebSocket(url, {
    onMessage: handleMessage,
    reconnect: false,
  });

  const estadoAnimado = useAnimatedMatchState(estadoPartido);

  function handleGoBack() {
    if (location.state?.returnPath) {
      navigate(location.state.returnPath, {
        state: {
          draftName: location.state.draftName,
          draftCode: location.state.draftCode,
        },
      });
      return;
    }

    navigate("/club/behaviors");
  }

  async function handleStop() {
    if (isStopping) return;

    try {
      setIsStopping(true);
      await stopBehaviorPreview(previewId);
    } catch (error) {
      console.error("Error al detener la prueba:", error);
    } finally {
      setIsStopping(false);
      handleGoBack();
    }
  }

  if (!estadoAnimado) {
    return <p>Preparando prueba...</p>;
  }

  const teamAStarters = estadoAnimado.players.filter(function (player) {
    return player.team === "A" && player.is_on_field;
  });

  const teamBStarters = estadoAnimado.players.filter(function (player) {
    return player.team === "B" && player.is_on_field;
  });

  return (
    <div>
      <div className="relative w-full max-w-[1920px] aspect-[16/9]">
        <svg
          viewBox="0 0 1920 1080"
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundColor: "#063343",
          }}
        >
          <SoccerField />

          <MatchPlayerInMatch
            players={estadoAnimado.players}
            playerNumbers={PREVIEW_PLAYER_NUMBERS}
            highlightedPlayerId={2}
          />

          <Scoreboard estado_partido={estadoAnimado} />

          {/* Tarjetas laterales del Equipo A (propio) */}
          {teamAStarters.map(function (player, index) {
            const y = 180 + index * 240;
            const isTestedPlayer = Number(player.player_id) === 2;
            const number = PREVIEW_PLAYER_NUMBERS[player.player_id];
            const behaviorLabel = isTestedPlayer
              ? "En prueba"
              : player.current_behavior_name || "Default";

            return (
              <g
                key={player.player_id}
                data-testid={`starter-card-${player.player_id}`}
              >
                <rect
                  x={40}
                  y={y}
                  width={110}
                  height={110}
                  fill={isTestedPlayer ? "#62B5E5" : "blue"}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={95}
                  y={y + 28}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isTestedPlayer ? "black" : "white"}
                  fontSize="18"
                  fontWeight="bold"
                >
                  {`Jugador ${number}`}
                </text>
                <text
                  x={95}
                  y={y + 54}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isTestedPlayer ? "black" : "white"}
                  fontSize="16"
                >
                  Number: {number}
                </text>
                <text
                  data-testid={`starter-behavior-${player.player_id}`}
                  x={95}
                  y={y + 80}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isTestedPlayer ? "black" : "#e2e8f0"}
                  fontSize="16"
                  fontWeight={isTestedPlayer ? "bold" : "normal"}
                >
                  {behaviorLabel}
                </text>
              </g>
            );
          })}

          {/* Tarjetas laterales del Equipo B (rival) */}
          {teamBStarters.map(function (player, index) {
            const y = 180 + index * 240;
            const number = PREVIEW_PLAYER_NUMBERS[player.player_id];

            return (
              <g
                key={player.player_id}
                data-testid={`starter-card-${player.player_id}`}
              >
                <rect
                  x={1790}
                  y={y}
                  width={110}
                  height={110}
                  fill="red"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={1845}
                  y={y + 42}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="20"
                  fontWeight="bold"
                >
                  {`Rival ${number}`}
                </text>
                <text
                  x={1845}
                  y={y + 68}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="18"
                >
                  Number: {number}
                </text>
              </g>
            );
          })}

          <Ball ball={estadoAnimado.ball} />
        </svg>

        {isFinished && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl shadow-lg text-center">
              <h2 className="text-2xl font-bold text-slate-100 mb-4">
                La prueba del comportamiento ha finalizado
              </h2>
              <button
                type="button"
                onClick={handleGoBack}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </div>

      {!isFinished && (
        <button
          type="button"
          onClick={handleStop}
          disabled={isStopping}
          className="absolute bottom-35 left-4 px-4 py-2 text-xl text-white bg-red-600 border border-red-600 rounded disabled:opacity-50"
        >
          {isStopping ? "Deteniendo..." : "Detener prueba"}
        </button>
      )}
    </div>
  );
}
