import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RosterBuilder } from "../../roster/components/RosterBuilder";;
import { useToast } from "../../../shared/hooks";
import RightDownAlert from "../../../shared/components/RightDownAlert";
import { sendNewL } from "../api";
import { useLeaguesSocket } from "../LeaguesProvider";

export default function CreateL({ onClose, roster: initialRoster = {} }) {

    // Estados para configurar alertas
    const[alert,setAlert] = useState(null)
    const {toast,showToast,hideToast} = useToast();
    //Estado para verificar envío y evitar clicks repetidos
    const [isSubmitting, setIsSubmitting] = useState(false)
    // Constante para navegar entre rutas
    const navigate = useNavigate();
    
    // Estado para recopilar datos del formulario 
    const [newL,setNewL] = useState({ 
      nombre: "", 
      duracion_partido: 100, 
      max_usuarios: 3, 
      es_privada: false, 
      password: "", 
      roster: initialRoster ?? {}
    })

    // Verificadores
    const rosterLoaded = newL.roster?.players?.length === 6;
    const Verification = !Number.isInteger(newL.duracion_partido) ||
                         newL.duracion_partido < 1 || newL.duracion_partido > 300 || !rosterLoaded ||
                         newL.nombre == "" || !Number.isInteger(newL.max_usuarios) ||
                         newL.max_usuarios < 3 || newL.max_usuarios > 22 ||
                         (newL.es_privada && newL.password.trim() === "") || newL.nombre.trim() === ""


    {/** Estado para crear roaster */}
    const [builderR, setBuilderR] = useState(false) 
    {/** Estado para notificar creación exitosa */}
    const [createdLId, setcreatedLId] = useState(null) 

    {/** Método para conectarse a websocket persistente entre vistas */}
    const joinL = useLeaguesSocket()?.joinL;

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        setAlert("");
        hideToast();
        setIsSubmitting(true);
        // console.log("se intenta enviar");

        try{
            const response = await sendNewL(newL);

            const idLiga = response?.id_liga;

            if(idLiga == null){
                setAlert("Fallo en comunicación con servidor");
                showToast(); 
            } else {

                try{
                    joinL?.(idLiga); // el WebSocket queda abierto
                    setcreatedLId(idLiga); 
                } catch {
                    setAlert("Se creó la liga pero falló conexión a lobby");
                    showToast(); 
                }
            }


        } catch (errorStatus) {
          if(errorStatus === "Missing body requirement"){
            setAlert("Error al crear, faltan parametros necesarios.");
            showToast();  
          } else {
            // console.log(errorStatus)
              setAlert("Error al crear, intente en otro momento.");
              showToast();  
          } 
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAnyInput = (e,parameter) => {
        setNewL({...newL, [parameter]: e.target.value})
        setAlert("");
        hideToast();
    }
    // console.log(newL)
    
    return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm">
          <div className="min-h-screen w-full flex items-start justify-center p-4 sm:p-8">
            <section className="relative w-fit max-w-6xl my-4 sm:my-8 bg-slate-800 border border-slate-700 p-5 sm:p-8 rounded-xl shadow-2xl">
    
              {/* Encabezado */}
              <div className="flex items-center justify-between gap-4 mb-8">
    
                <h2 className="text-xl sm:text-5xl font-bold text-slate-100 uppercase tracking-wider">
                  Crear Liga
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
    
              {/* nombre */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <label
                  htmlFor="nombre"
                  className="shrink-0 text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                >
                  Nombre:
                </label>
    
                <input
                  id="nombre"
                  className="w-full border-2 border-slate-500 py-2 px-3 rounded-md text-xl sm:text-3xl"
                  type="text"
                  value={newL.nombre}              
                  onChange={(event) => {
                      handleAnyInput(event, "nombre");
                    }
                  }                  
                />
              </div>

              {/* duracion_partido */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <label
                  htmlFor="duracion_partido"
                  className="shrink-0 text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                >
                  Duración de cada partido (segundos):
                </label>
    
                <input
                  id="duracion_partido"
                  className="w-full max-w-[80px] shrink-0 border-2 border-slate-500 py-2 px-3 rounded-md text-xl sm:text-3xl"
                  type="number"
                  min="1"
                  max="300"
                  value={newL.duracion_partido}
                  onKeyDown={(event) => {
                    const permitidas = ["Backspace", "Delete", "Tab", 
                                        "Enter", "ArrowLeft", "ArrowRight", 
                                        "Home", "End"];
                    const esAtajo = event.ctrlKey || event.metaKey; // Ctrl+V, Ctrl+A, etc.
    
                    if (!/^[0-9]$/.test(event.key) && !permitidas.includes(event.key) && !esAtajo) {
                        event.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                      setNewL({...newL, ["duracion_partido"]: Number(e.target.value)})
                      setAlert("");
                      hideToast();
                    }
                  }               
                />
              </div>

              {/* max_usuarios */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <label
                  htmlFor="max_usuarios"
                  className="shrink-0 text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                >
                  Cantidad de jugadores:
                </label>
    
                <input
                  id="max_usuarios"
                  className="w-full max-w-[80px] shrink-0 border-2 border-slate-500 py-2 px-3 rounded-md text-xl sm:text-3xl"
                  type="number"
                  min="3"
                  max="22"
                  value={newL.max_usuarios}
                  onKeyDown={(event) => {
                    const permitidas = ["Backspace", "Delete", "Tab", 
                                        "Enter", "ArrowLeft", "ArrowRight", 
                                        "Home", "End"];
                    const esAtajo = event.ctrlKey || event.metaKey; // Ctrl+V, Ctrl+A, etc.
    
                    if (!/^[0-9]$/.test(event.key) && !permitidas.includes(event.key) && !esAtajo) {
                        event.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                      setNewL({...newL, ["max_usuarios"]: Number(e.target.value)})
                      setAlert("");
                      hideToast();
                    }
                  } 
                />
              </div>

              {/* es_privada */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <label
                  htmlFor="es_privada"
                  className="shrink-0 text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                >
                  Privada:
                </label>
    
                <input
                  id="es_privada"
                  className="ml-auto h-6 w-6 accent-emerald-500"
                  type="checkbox"
                  checked={newL.es_privada}
                  value={newL.es_privada}              
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setNewL({
                      ...newL,
                      es_privada: checked,
                      password: checked ? newL.password : "",
                    });
                    setAlert("");
                    hideToast();
                    }}                
                />
              </div>

              {/* password */}
              {newL.es_privada && <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <label
                  htmlFor="password"
                  className="shrink-0 text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                >
                  Contraseña:
                </label>
    
                <input
                  id="password"
                  className="w-full border-2 border-slate-500 py-2 px-3 rounded-md text-xl sm:text-3xl"
                  type="text"
                  value={newL.password}              
                  onChange={(event) => {
                    handleAnyInput(event, "password");
                  }
                }                  
                />
              </div>}

              {!rosterLoaded && <label>Para crear la liga debes elegir tu propia plantilla primero</label>}
              
    
              {/* Constructor de plantilla */}
              {builderR && (
                <div className="mt-6 min-w-[700px]">
                  <RosterBuilder
                    onSubmit={(roster) => {
                        try{
                            setNewL((previous) => ({
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
                  disabled={Verification || isSubmitting}
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
                  {isSubmitting ? "CREANDO..." : "CREAR"}
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
    
            {/** Alerta: la liga se creó pero no se pudo abrir la conexión */}
            {alert === "Se creó la liga pero falló conexión a lobby" && toast && (
                <RightDownAlert
                    key={toast.id}
                    toast={toast}
                    errorTitle="No se pudo conectar a la liga"
                    errorDescription={alert}
                    color="orange"
                />
            )}
    
            {/** Alerta: error al guardar ID en sessionStorage */}
            {alert === "Error al crear, faltan parametros necesarios." && toast && (
                <RightDownAlert
                    key={toast.id}
                    toast={toast}
                    errorTitle="Felicidades, rompiste el formulario"
                    errorDescription={alert}
                    color="red"
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
            {createdLId !== null && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md">
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">Liga creada</h3>
                  <p className="text-slate-300 mb-6">¿Quieres redirigirte al lobby de tu liga?</p>
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
                        navigate(`/league/lobby/${createdLId}`);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                    >
                      Lobby
                    </button>
                  </div>
                </div>
              </div>
            )}
    
        </div>
  );
}