import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendNewFM } from "../api";
import { RosterBuilder } from "../../roster/components/RosterBuilder";
import { useFriendlyGamesSocket } from "../FriendlyGamesProvider";

export default function CreateFG({ onClose }) {

    //const[alert,setAlert] = useState(null)
    //const {toast,showToast,hideToast} = useToast();
    const navigate = useNavigate();

    const [newFG,setNewFG] = useState({
        duration: 300,
        roster: {}
    })
    const rosterLoaded = newFG.roster?.players?.length === 6;

    {/** Estado para crear roaster */}
    const [builderR, setBuilderR] = useState(false) 
    {/** Estado para notificar creación exitosa */}
    const [createdFGId, setCreatedFGId] = useState(null) 

    {/** Método para conectarse a websocket persistente entre vistas */}
    const {joinFG} = useFriendlyGamesSocket();

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log("se intenta enviar");

        try{
            const response = await sendNewFM(newFG);

            const fgID = response.id_friendlyGame;
            joinFG(fgID); // el WebSocket queda abierto
            setCreatedFGId(fgID); 

        } catch (errorStatus) {
            console.log(errorStatus)
            if(errorStatus == "Error: Not found."){
                console.log("No se encontró endpoint")
            }
        }
    }

    const handleAnyInput = (e,parameter) => {
        setNewFG({...newFG, [parameter]: Number(e.target.value)})
        //setAlert("");
        //setToast(null);
    }
    //console.log(newFG)
    
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
              value={newFG.duration}
              onChange={(event) => handleAnyInput(event, "duration")}
            />
          </div>
          

          {/* Constructor de plantilla */}
          {builderR && (
            <div className="mt-6 min-w-[700px]">
              <RosterBuilder
                onSubmit={(roster) => {
                  setNewFG((previous) => ({
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
              disabled={newFG.duration <= 0 || !rosterLoaded}
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

        {/* Notificación de creación exitosa y redirección */}
        {createdFGId !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md">
              <h3 className="text-2xl font-bold text-slate-100 mb-2">Partido creado</h3>
              <p className="text-slate-300 mb-6">¿Querés ir a la vista del partido ahora?</p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg"
                >
                  Volver a la lista
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/friendly/${createdFGId}`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                >
                  Ir al partido
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}