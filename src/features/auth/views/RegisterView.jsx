import { useEffect, useState } from 'react';
import { sendRegisterToAPI } from "../api.js";
import { removeToken, saveTokenLocalStorage } from "../auth";
import { useContext } from "react";
import { AuthContext } from "../AuthProvider.jsx";

import JpgInput from '../components/jpgToB64.jsx';

import { Link } from "react-router-dom";
import ErrorAlert from '../components/errorAlert.jsx';
import { useToast } from '../../../shared/hooks.js';
import FieldsetRegister from '../components/fieldsetRegister.jsx';

export default function Login() {

    const [newUser, setNewUser] = useState({
        email: "",
        password: "",
        clubname: "",
        avatar: ""
    })

    {/** Logica para crear notificaciones de error */}
    const [error, setError] = useState("");
    {/** Logica para actualizar notificaciones de error */}
    const {toast, showToast, hideToast} = useToast();
    
    {/** Logica para enviar formulario */}
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        hideToast();

        try{
            const response = await sendRegisterToAPI(newUser); //envia endpoint
            if (response.status === 400) {
                setError("Email ya utilizado.");
                showToast();
                return;
            }
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

            const data = await response.json();  

        } catch (err) {
            console.log("Error al registrarse:", err);
            setError("Error al conectarse con el servidor.");
            showToast();
        }
    };

    /** Verificar los dos campos de contraseña del formulario */
    const [passwordConfirm, setPasswordConfirm ] = useState(false);
    const passwordVerified = newUser.password !== "" && passwordConfirm === newUser.password;

    const handleAnyInput = (e,parameter) => {
        setNewUser({...newUser, [parameter]: e.target.value})
        setError("");
        hideToast();
    }

    console.log(newUser);

  return (
    <div className="leading-normal mi-fuente min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">

        <h1 className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-3">
            FUTBOT
        </h1>
        
        {/** Alerta: email ya utilozado */}
        {error === "Email ya utilizado." && toast && (
            <ErrorAlert
                key={toast.id}
                toast={toast}
                errorTitle="No se pudo completar el registro"
                errorDescription={error}
                color="orange"
            />
        )}

        {/** Alerta: error al enviar request */}
        {error === "Error al conectarse con el servidor." && toast && (
            <ErrorAlert
                key={toast.id}
                toast={toast}
                errorTitle="No se pudo completar el registro"
                errorDescription={error}
                color="red"
            />
        )}

        {/** Alerta: error al enviar request */}
        {(error === "Solo se permiten archivos JPG" ||
          error === "La imagen supera 1 MB"         ||
          error === "No se pudo leer el archivo") 
            && toast 
            && (<ErrorAlert
                    key={toast.id}
                    errorTitle="Error al cargar avatar"
                    errorDescription={error}
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
                                    setError("");
                                    hideToast();
                                }
                              }} 
                              onError={(message) => {
                                setError(message);
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
