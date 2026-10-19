import { useState } from "react";
import { useToast } from "../../../shared/hooks";
import RightDownAlert from "../../../shared/components/RightDownAlert";
import { joinLeagueAsPlayer } from "../api";
import { useLeaguesSocket } from "../LeaguesProvider";

const PRIVACY_LABELS = {
    PUBLICA: "Pública",
    PRIVADA: "Privada",
};

/**
 * Tarjeta de una liga dentro del listado.
 * Permite unirse como participante (con la plantilla cargada en la vista).
 * La vista interna de la liga se resuelve en otro ticket.
 */
export function LeagueCard({ league, roster }) {
    const rosterLoaded = roster?.players?.length === 6;
    const socket = useLeaguesSocket();
    const joinL = socket?.joinL;
    const joinedLIds = socket?.joinedLIds ?? [];

    const [alert, setAlert] = useState(null);
    const { toast, showToast, hideToast } = useToast();
    const [isJoining, setIsJoining] = useState(false);
    const [joinedNow, setJoinedNow] = useState(false);

    // Modal de contraseña (solo ligas privadas)
    const [askPassword, setAskPassword] = useState(false);
    const [password, setPassword] = useState("");

    const hasJoined = joinedNow || joinedLIds.includes(league.id_liga);
    const isPrivate = league.privacy === "PRIVADA";
    const isFull = league.current_participants >= league.capacity;
    const isPlaying = league.state === "JUGANDO";

    // Solo se puede unir con plantilla, con cupo, sin haber comenzado y sin estar ya unido
    const isJoinDisabled = hasJoined || isFull || isPlaying || !rosterLoaded || isJoining;

    const closePasswordModal = () => {
        setAskPassword(false);
        setPassword("");
    };

    const markJoined = () => {
        joinL?.(league.id_liga);
        setJoinedNow(true);
        closePasswordModal();
    };

    const submitJoin = async (pass) => {
        setAlert("");
        hideToast();
        setIsJoining(true);

        try {
            await joinLeagueAsPlayer(league.id_liga, { roster, password: pass });
            markJoined();
        } catch (err) {
            if (err.code === "ALREADY_PARTICIPATING") {
                markJoined();
            } else if (err.code === "FULL") {
                setAlert("La liga está llena");
                showToast();
            } else if (err.code === "INCORRECT_PASSWORD") {
                setAlert("Contraseña incorrecta");
                showToast();
            } else {
                setAlert("Error al unirse, intente en otro momento.");
                showToast();
            }
        } finally {
            setIsJoining(false);
        }
    };

    const handleJoin = () => {
        if (isPrivate) {
            setAskPassword(true);
            return;
        }
        submitJoin();
    };

    return (
        <div className="h-full p-4 bg-slate-800 border border-slate-700 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-lg font-bold text-slate-100">
                    {league.name}
                </span>
                <span className="text-lg font-medium text-slate-200">
                    Usuarios: {league.current_participants} de {league.capacity}
                </span>
                <span className="text-lg font-medium text-slate-200">
                    Privacidad: {PRIVACY_LABELS[league.privacy] ?? league.privacy}
                </span>
                <span className="text-lg font-medium text-slate-200">
                    estado: {league.state}
                </span>
            </div>

            {alert && toast && (
                <RightDownAlert
                    key={toast.id}
                    toast={toast}
                    errorTitle="Aviso"
                    errorDescription={alert}
                    color={alert.includes("llena") ? "orange" : "red"}
                />
            )}

            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={isJoinDisabled}
                    onClick={handleJoin}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {hasJoined ? "Unido" : "Unirse"}
                </button>
            </div>

            {askPassword && (
                <div
                    role="dialog"
                    aria-label="Contraseña de la liga"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                >
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm mx-4">
                        <h3 className="text-2xl font-bold text-slate-100 mb-4">
                            Liga privada
                        </h3>

                        <label htmlFor={`league-password-${league.id_liga}`} className="block text-slate-300 mb-2">
                            Contraseña:
                        </label>
                        <input
                            id={`league-password-${league.id_liga}`}
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setAlert("");
                                hideToast();
                            }}
                            className="w-full border-2 border-slate-500 py-2 px-3 rounded-md text-xl mb-6"
                        />

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={closePasswordModal}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={password.trim() === "" || isJoining}
                                onClick={() => submitJoin(password)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
