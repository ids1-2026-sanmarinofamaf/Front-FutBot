import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendNewFM } from "../api";
import { RosterBuilder } from "../../roster/components/RosterBuilder";
import { useFriendlyGamesSocket } from "../FriendlyGamesProvider";
import { useToast } from "../../../shared/hooks";
import RightDownAlert from "../../../shared/components/RightDownAlert";

export default function CreateFG({ onClose }) {

    const[alert,setAlert] = useState(null)
    const {toast,showToast,hideToast} = useToast();
    const navigate = useNavigate();

    const [newFG,setNewFG] = useState({
        duration: 300,
        roster: {}
    })
    const rosterLoaded = newFG.roster?.players?.length === 6;
    const Verification = newFG.duration < 1 || !rosterLoaded || newFG.duration > 300;

    {/** Estado para crear roaster */}
    const [builderR, setBuilderR] = useState(false) 
    {/** Estado para notificar creación exitosa */}
    const [createdFGId, setCreatedFGId] = useState(null) 

    {/** Método para conectarse a websocket persistente entre vistas */}
    const {joinFG} = useFriendlyGamesSocket();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setAlert("");
        hideToast();
        console.log("se intenta enviar");

        try{
            const response = await sendNewFM(newFG);

            const fgID = response?.id_friendlyGame;

            if(fgID == null){
                setAlert("Fallo en comunicación con servidor");
                showToast(); 
            } else {

                try{
                    joinFG(fgID); // el WebSocket queda abierto
                    setCreatedFGId(fgID); 
                } catch {
                    setAlert("No se guardó ID de partido amistoso");
                    showToast(); 
                }
            }


        } catch (errorStatus) {
            console.log(errorStatus)
            setAlert("Error al crear, intente en otro momento.");
            showToast();  
            if(errorStatus == "Error: Not found."){
                //console.log("No se encontró endpoint")
            }
        }
    }

    const handleAnyInput = (e,parameter) => {
        setNewFG({...newFG, [parameter]: Number(e.target.value)})
        setAlert("");
        hideToast();
    }
    console.log(newFG)
    
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
              max="300"
              value={newFG.duration}
              onKeyDown={(event) => {
                const permitidas = ["Backspace", "Delete", "Tab", 
                                    "Enter", "ArrowLeft", "ArrowRight", 
                                    "Home", "End"];
                const esAtajo = event.ctrlKey || event.metaKey; // Ctrl+V, Ctrl+A, etc.

                if (!/^[0-9]$/.test(event.key) && !permitidas.includes(event.key) && !esAtajo) {
                    event.preventDefault();
                }
              }}
              onChange={(event) => {
                handleAnyInput(event, "duration");
              }
            }
              
            />
          </div>
          

          {/* Constructor de plantilla */}
          {builderR && (
            <div className="mt-6 min-w-[700px]">
              <RosterBuilder
                onSubmit={(roster) => {
                    try{
                        setNewFG((previous) => ({
                          ...previous,
                          roster
                        }));
                    } catch {
                        setAlert("Error al editar plantilla");
                        showToast(); 
                    }
                    
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
              disabled={Verification}
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
        
        {/** Alerta: Error al usar apiClient */}
        {alert === "Error al crear, intente en otro momento." && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="No se pudo enviar solicitud al servidor"
                errorDescription={alert}
                color="red"
            />
        )}

        {/** Alerta: mala comunicación entre front y back */}
        {alert === "Fallo en comunicación con servidor" && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="Respuesta invalida del servidor"
                errorDescription={alert}
                color="red"
            />
        )}

        {/** Alerta: error al guardar ID en sessionStorage */}
        {alert === "Se creó partido amistoso pero falló conexión a lobby" && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="No se guardó ID de partido amistoso"
                errorDescription={alert}
                color="orange"
            />
        )}

        {/** Alerta: error al guardar ID en sessionStorage */}
        {alert === "Error al editar plantilla" && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="No se cargó plantilla"
                errorDescription={alert}
                color="orange"
            />
        )}


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