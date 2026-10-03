import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../shared/api/client";
import { sendNewFM } from "../api";
import { RosterBuilder } from "../../roster/components/RosterBuilder";

export default function FriendlyGames() {
    const [createFMisOpen, setCreateFMisOpen] = useState(false)

    
    return(
    <div className="leading-normal mi-fuente min-h-screen 
                    bg-slate-900 
                    flex flex-col items-center justify-start p-4">
        <h1 className="text-4xl font-extrabold text-transparent
                       bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-3">
            PARTIDOS AMISTOSOS
        </h1>

        {createFMisOpen && <CreateFM onClose={() => setCreateFMisOpen(false)} />}

        <button onClick={() => setCreateFMisOpen(true)}>
            NUEVO
        </button>
    </div>)
}

function CreateFM({ onClose }) {

    //const[alert,setAlert] = useState(null)
    //const {toast,showToast,hideToast} = useToast();

    const [newFM,setNewFM] = useState({
        duration: 300,
        roster: {}
    })

    const rosterLoaded = newFM.roster?.players?.length === 6;

    const [builderR, setBuilderR] = useState(false)

    const sendNewFM = async (newFMData) => {
        return apiClient("/friendly_games", {
            method: "POST",
            body: JSON.stringify(newFMData)
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log("se intenta enviar")

        try{
            const response = await sendNewFM(newFM)
        } catch (errorStatus) {
            console.log(errorStatus)
            if(errorStatus == "Error: Not found."){
                console.log("No se encontró endpoint")
            }
        }
    }

    const handleAnyInput = (e,parameter) => {
        setNewFM({...newFM, [parameter]: e.target.value})
        //setAlert("");
        //setToast(null);
    }
    console.log(newFM)
    
    return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm">
      <div className="min-h-screen w-full flex items-start justify-center p-4 sm:p-8">
        <section className="relative w-fit max-w-6xl my-4 sm:my-8 bg-slate-800 border border-slate-700 p-5 sm:p-8 rounded-xl shadow-2xl">

          {/* Encabezado */}
          <div className="flex items-center justify-between gap-4 mb-8">

            <h2 className="text-xl sm:text-5xl font-bold text-slate-100 uppercase tracking-wider">
              Crear partido amistoso
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-slate-400 hover:text-white transition-colors text-5xl font-bold"
              aria-label="Cerrar opciones"
            >
              ×
            </button>
          </div>

          {/* Duración */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <label
              htmlFor="duration"
              className="shrink-0 text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
            >
              Duración del partido (minutos):
            </label>

            <input
              id="duration"
              className="w-full max-w-[100px] border-2 border-slate-500 py-2 px-3 rounded-md text-xl sm:text-3xl"
              type="number"
              min="1"
              value={newFM.duration}
              onChange={(event) => handleAnyInput(event, "duration")}
            />
          </div>
          

          {/* Constructor de plantilla */}
          {builderR && (
            <div className="mt-6 min-w-[700px]">
              <RosterBuilder
                onSubmit={(roster) => {
                  setNewFM((previous) => ({
                    ...previous,
                    roster
                  }));

                  setBuilderR(false);
                }}
                onCancel={() => setBuilderR(false)}
              />
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-slate-700">
            
            {/* Botón para editar plantilla */}
            {!builderR && (
                <button
                type="button"
                onClick={() => setBuilderR(true)}
                className="w-full sm:w-auto px-6 py-3 text-left text-2xl sm:text-4xl font-extrabold
                            text-slate-200 bg-slate-700 hover:bg-slate-600
                            rounded-lg transition-colors" 
                >
                Editar plantilla
                </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={newFM.duration <= 0 || !rosterLoaded}
              onClick={handleSubmit}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors
                        disabled:bg-gray-500
                        disabled:border-gray-500
                        disabled:text-gray-300
                        disabled:hover:bg-gray-500
                        disabled:hover:text-gray-300
                        disabled:active:text-gray-300
                        disabled:focus:ring-0
                        disabled:cursor-not-allowed"
            >
              CREAR
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function RosterView() {
  const handleSubmit = async (rosterPayload) => {
    console.log('Plantilla:', rosterPayload);

    // Por ejemplo:
    // await createRoster(rosterPayload);
  };

  const handleCancel = () => {
    console.log('El usuario canceló');
  };

  return (
    <RosterBuilder
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}