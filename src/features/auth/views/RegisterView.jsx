import {  useState } from 'react';
import { sendRegisterToAPI } from "../api.js";
import JpgInput from '../components/JpgToB64.jsx';
import { Link } from "react-router-dom";
import RightDownAlert from '../components/RightDownAlert.jsx';
import { useToast } from '../../../shared/hooks.js';
import FieldsetRegister from '../components/FieldsetRegister.jsx';

export default function Login() {

    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        clubname: "",
        avatar: ""
    })

    {/** Logica para crear notificaciones de error */}
    const [alert, setAlert] = useState("");
    {/** Logica para actualizar notificaciones de error */}
    const {toast, showToast, hideToast} = useToast();
    
    {/** Logica para enviar formulario */}
    const handleSubmit = async (event) => {
        event.preventDefault();
        setAlert("");
        hideToast();

        try{
            const response = await sendRegisterToAPI(newUser); //envia endpoint

            {/** Registro creado correctamente */}
            if(response.status === 201){
                setAlert("Usuario registrado correctamente");
                showToast();             
                return;
            }

            if (response.status === 400) {
                {/** Registro creado correctamente */}
                if (data.response === "Email already used."){
                    setAlert("Email ya utilizado.");
                } else if (data.response === "Required parameters are missing or incorrect."){
                    setAlert("Parametros requeridos inválidos o incorrectos");
                }
                showToast();
                return;
            }
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

            const data = await response.json();  

        } catch (err) {
            console.log("Error al registrarse:", err);
            setAlert("Error al conectarse con el servidor.");
            showToast();
        }
    };

    /** Verificar los dos campos de contraseña del formulario */
    const [passwordConfirm, setPasswordConfirm ] = useState(false);
    const passwordVerified = newUser.password !== "" && passwordConfirm === newUser.password;

    const handleAnyInput = (e,parameter) => {
        setNewUser({...newUser, [parameter]: e.target.value})
        setAlert("");
        hideToast();
    }

    console.log(newUser);

  return (
    <div className="leading-normal mi-fuente min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">

        <h1 className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-3">
            FUTBOT
        </h1>

        {/** Alerta: Cuenta creada exitosamente */}
        {alert === "Usuario registrado correctamente" && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="Registro exitoso"
                errorDescription={alert}
                color="green"
            />
        )}
        
        {/** Alerta: email ya utilizado */}
        {alert === "Email ya utilizado." && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="No se pudo completar el registro"
                errorDescription={alert}
                color="orange"
            />
        )}

        {/** Alerta: error al enviar request */}
        {alert === "Error al conectarse con el servidor." && toast && (
            <RightDownAlert
                key={toast.id}
                toast={toast}
                errorTitle="No se pudo completar el registro"
                errorDescription={alert}
                color="red"
            />
        )}

        {/** Alerta: error al enviar request */}
        {(alert === "Solo se permiten archivos JPG" ||
          alert === "La imagen supera 1 MB"         ||
          alert === "No se pudo leer el archivo") 
            && toast 
            && (<RightDownAlert
                    key={toast.id}
                    errorTitle="Error al cargar avatar"
                    errorDescription={alert}
                    color="orange"
                />)
        }

        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl ">
        {/** Formulario de registro */}
            <form onSubmit={handleSubmit} 
                className="grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-4 gap-y-4"
            >

                {/** email */}
                <FieldsetRegister 
                    title="Email" idFieldset="email" typeFieldset="text"
                    onChangeFieldset={(e) => handleAnyInput(e, "email")} value_fieldset={newUser.email}
                />

                {/** contraseña // "flex flex-row items-center gap-3 mb-4" */}
                <FieldsetRegister 
                    title="Contraseña" idFieldset="passw" typeFieldset="password"
                    onChangeFieldset={(e) => handleAnyInput(e, "password")} valueFieldset={newUser.password}
                />
                
                {/** contraseña verificacion */}
                <FieldsetRegister
                    title="Repita contraseña" idFieldset="password_verif" typeFieldset="password"
                    onChangeFieldset={(e) => setPasswordConfirm(e.target.value)}
                />

                {/** club */}
                <FieldsetRegister 
                    title="Nombre de club" idFieldset="clubname" typeFieldset="text"
                    onChangeFieldset={(e) => handleAnyInput(e, "clubname")} parameter="clubname" valueFieldset={newUser.clubname}
                />

                {/** avatar */}
                <fieldset className="contents">
                    <label
                        htmlFor="avatar"
                        className="text-4xl font-extrabold text-transparent text-right
                                    bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                    >
                        Avatar:
                    </label>

                    <JpgInput id="avatar"
                              toast={toast} 
                              onChange={(b64) => {
                                setNewUser((prev) => ({ ...prev, avatar: b64 }));
                                if(b64){
                                    setAlert("");
                                    hideToast();
                                }
                              }} 
                              onError={(message) => {
                                setAlert(message);
                                showToast();
                              }}
                    />
                </fieldset>

                {/** boton registro */}
                <button
                type="submit"
                disabled={
                        !newUser.email    || 
                        !newUser.password || 
                        !newUser.clubname || 
                        !newUser.avatar   || 
                        !passwordVerified}
                className="col-span-2 px-6 py-2 min-w-[120px] text-3xl text-center text-emerald-300
                    bg-blue-500 border border-blue-500 rounded
                    active:text-blue-800
                    hover:bg-emerald-300
                    hover:text-blue-500
                    focus:outline-1 
                    focus:ring
                    disabled:bg-gray-500
                    disabled:border-gray-500
                    disabled:text-gray-300
                    disabled:hover:bg-gray-500
                    disabled:hover:text-gray-300
                    disabled:active:text-gray-300
                    disabled:focus:ring-0
                    disabled:cursor-not-allowed"
                >
                Registrarse
                </button>
            </form>
        </div>

        <div className="flex flex-col mt-4">
            <h1 className="text-center text-2xl font-semibold text-gray-600">
                ¿Tienes una cuenta?
            </h1>
            <Link
            to="/login"
            className="px-6 py-2 min-w-[120px] 
                       text-base text-center text-white 
                       bg-blue-500 border border-blue-500 rounded
                       active:text-blue-800
                       hover:bg-emerald-300
                       hover:text-blue-500
                       focus:outline-none focus:ring">
                Iniciar sesión
            </Link>
        </div>

        <h2 className="text-xl font-semibold text-slate-300 mt-4">
            San Marino FAMAF
        </h2>
    </div>
    );
}
