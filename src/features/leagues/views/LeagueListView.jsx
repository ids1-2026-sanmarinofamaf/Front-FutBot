import { useNavigate } from "react-router-dom";
import { useSessionSocket } from "../../auth/SessionSocketProvider";
import { LeagueCard } from "../components/LeagueCard";

export default function LeagueListView() {
  const navigate = useNavigate();

  {/* Busca mensajes de ws de sesión y filtra las ligas */}
  const { messages } = useSessionSocket();
  const leagues = messages?.leagues ?? [];

  return (
    <div className="leading-normal mi-fuente min-h-screen bg-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 mb-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="self-start shrink-0 px-6 py-3 bg-slate-700 hover:bg-slate-600
                       text-slate-200 rounded-lg font-semibold transition-colors"
          >
            Volver al menú
          </button>

          <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-wider
                         text-transparent bg-clip-text
                         bg-gradient-to-r from-blue-400 to-emerald-400">
            LIGAS
          </h1>

          {/* La creación de liga se implementa en otro ticket: por ahora sin acción */}
          <button
            type="button"
            className="sm:ml-auto self-start shrink-0 px-8 py-3 text-3xl bg-emerald-600
                       hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors"
          >
            CREAR LIGA
          </button>
        </div>

        {/* Lista de ligas disponibles */}
        <section className="bg-slate-800/60 border border-slate-700 rounded-xl shadow-2xl p-5 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              Ligas disponibles
            </h2>
            <span className="text-sm text-slate-400">
              {leagues.length} disponibles
            </span>
          </div>

          {leagues.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {leagues.map(league => (
                <LeagueCard
                  key={league.league_id}
                  league={league}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-slate-400">
              No hay ligas disponibles.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

