import { useNavigate } from "react-router-dom";
import { useSessionSocket } from "../../auth/SessionSocketProvider";
import { LeagueCard } from "../components/LeagueCard";
import { useState } from "react";
import CreateL from "../components/CreateL";
import { RosterBuilder } from "../../roster/components/RosterBuilder";

export default function LeagueListView() {
  const navigate = useNavigate();

  {/* Busca mensajes de ws de sesión y filtra las ligas */}
  const { messages } = useSessionSocket();
  const leagues = messages?.leagues ?? [];

  const [createLisOpen, setCreateLisOpen] = useState(false);

  {/** Estados para crear roster, compartido entre crear y unirse a ligas */}
  const [roster, setRoster] = useState(null);
  const [builderR, setBuilderR] = useState(false);

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

          <button
            type="button"
            onClick={() => setCreateLisOpen(true)}
            className="sm:ml-auto self-start shrink-0 px-8 py-3 text-3xl bg-emerald-600
                       hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors"
          >
            CREAR LIGA
          </button>

          {/* Constructor de liga */}
          {createLisOpen && (
            <CreateL onClose={() => setCreateLisOpen(false)} roster={roster} />
          )}

        </div>

        {/* Definición de roster */}
        <section className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl
                            p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center
                            sm:justify-between gap-4">
          <div>
            <p className="text-lg sm:text-2xl text-slate-300">
              Edite su plantilla para unirse a una liga o para crear una
            </p>

            {roster === null && (
              <p className="text-red-500 font-semibold">
                La plantilla todavía no ha sido cargada.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setBuilderR(true)}
            className="shrink-0 px-12 py-3 text-5xl bg-emerald-600 hover:bg-emerald-500
                      text-white rounded-lg font-semibold transition-colors"
          >
            EDITAR
          </button>
        </section>

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
                  key={league.id_liga}
                  league={league}
                  roster={roster}
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

      {/* Editor de plantilla */}
      {builderR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setBuilderR(false)} // cerrar al hacer click afuera
        >
          <div
            className="max-h-[90vh] min-w-[700px] overflow-auto rounded-lg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()} // evita cerrar al hacer click adentro
          >
            <RosterBuilder
              onSubmit={(nuevoRoster) => {
                setRoster(nuevoRoster);
                setBuilderR(false);
              }}
              onCancel={() => setBuilderR(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
