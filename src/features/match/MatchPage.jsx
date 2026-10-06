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
      return;
    }

    if (event.code === 1000) {
      console.log("El partido finalizó");
      return;
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
        <div className="relative">
        <p>{errorMessage}</p>
        <ExitMatchButton />
        </div>
    );
}

  if (!estadoAnimado) {
    return <p>Conectando al partido...</p>;
  }

  return (
    <Match
      estado_partido={estadoAnimado}
    />
  );
}