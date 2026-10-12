const PRIVACY_LABELS = {
    PUBLICA: "Pública",
    PRIVADA: "Privada",
};

/**
 * Tarjeta de una liga dentro del listado.
 * Solo muestra datos: unirse y ver la liga se resuelven en otros tickets,
 * por eso las acciones llegan como callbacks opcionales.
 */
export function LeagueCard({ league, onJoin, onView }) {
    const isFull = league.current_participants >= league.capacity;
    const isPlaying = league.state === "JUGANDO";

    // Solo se puede unir como participante a una liga con cupo que no haya comenzado
    const isJoinDisabled = isFull || isPlaying;

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

            <div className="flex gap-2">
                <button
                    type="button"
                    disabled={isJoinDisabled}
                    onClick={() => onJoin?.(league)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Unirse
                </button>
                <button
                    type="button"
                    onClick={() => onView?.(league)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors"
                >
                    Ver
                </button>
            </div>
        </div>
    );
}

