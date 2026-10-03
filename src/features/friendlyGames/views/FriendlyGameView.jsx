import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateFG from "../components/CreateFG";

export default function FriendlyGames() {
  const navigate = useNavigate();
  const [createFMisOpen, setCreateFMisOpen] = useState(false);

  return (
    <div className="leading-normal mi-fuente min-h-screen bg-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">

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
            PARTIDOS AMISTOSOS
          </h1>
        </div>

        {/* Panel de acciones */}
        <section className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl
                            p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center
                            sm:justify-between gap-4">
          <p className="text-lg sm:text-2xl text-slate-300">
            Creá un partido amistoso eligiendo la duración y tu plantilla.
          </p>

          <button
            type="button"
            onClick={() => setCreateFMisOpen(true)}
            className="shrink-0 px-12 py-3 text-5xl bg-emerald-600 hover:bg-emerald-500
                       text-white rounded-lg font-semibold transition-colors"
          >
            NUEVO
          </button>
        </section>
      </div>

      {createFMisOpen && <CreateFG onClose={() => setCreateFMisOpen(false)} />}
    </div>
  );
}