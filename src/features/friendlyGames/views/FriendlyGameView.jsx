import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateFG from "../components/CreateFG";
import { FGCard } from "../components/FGCard";
import { RosterBuilder } from "../../roster/components/RosterBuilder";

export default function FriendlyGames() {
  const navigate = useNavigate();
  const [createFMisOpen, setCreateFMisOpen] = useState(false);


  {/** Estados para crear roaster */}
  const [roster, setRoster] = useState(null)
  const [builderR, setBuilderR] = useState(false) 
  //console.log(roster)

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
            PARTIDOS AMISTOSOS
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

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

          {/* Definición de roster */}
          <section className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl
                              p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center
                              sm:justify-between gap-4">
            <p className="text-lg sm:text-2xl text-slate-300">
              Edite su plantilla para unirse a un partido amistoso o para crear uno
            </p>

            <button
              type="button"
              onClick={() => setBuilderR(true)}
              className="shrink-0 px-12 py-3 text-5xl bg-emerald-600 hover:bg-emerald-500
                        text-white rounded-lg font-semibold transition-colors"
            >
              EDITAR
            </button>

          </section>
        </div>


      </div>
      
      {/* Constructor de partido amistoso */}
      {createFMisOpen && <CreateFG onClose={() => setCreateFMisOpen(false)} roster={roster}/>}

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