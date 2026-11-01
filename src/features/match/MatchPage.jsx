import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "../../shared/hooks.js";
import { Match } from "./views/Match";
import { useAnimatedMatchState } from "./useAnimatedMatchState.js";
import { ExitMatchButton } from "./components/ExitMatchButton";

const WS_BASE_URL = import.meta.env.VITE_WS_SESSION_URL;

export function MatchPage() {
  const { matchId } = useParams();

  const [estadoPartido, setEstadoPartido] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleMessage = useCallback(function (data) {
    setEstadoPartido(data);
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

  const url = matchId
    ? `${WS_BASE_URL}/ws/matches/${matchId}`
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
    />
  );
}