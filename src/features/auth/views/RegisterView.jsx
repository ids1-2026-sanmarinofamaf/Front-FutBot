import { useState } from 'react';
import { sendRegisterToAPI } from "../api.js";
import { removeToken, saveTokenLocalStorage } from "../auth";
import { useContext } from "react";
import { AuthContext } from "../AuthProvider.jsx";

import JpgInput from '../components/jpgToB64.jsx';

import { Link } from "react-router-dom";

export default function Login() {

    const [newUser, setNewUser] = useState({
        username: "",
        email: "",
        password: "",
        clubname: "",
        avatar: ""
    })

    const [error, setError] = useState("");
    const [toast, setToast] = useState(null); // { id } mientras se muestra
    

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setToast(null);

        try{
            const response = await sendRegisterToAPI(newUser); //envia endpoint
            if (response.status === 400) {
                setError("Email ya utilizado.");
                setToast({ id: Date.now() });
                return;
            }
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

            const data = await response.json();  

        } catch (err) {
            console.log("Error al registrarse:", err);
            setError("Error al enviar request.");
            setToast({ id: Date.now() });
        }
    };

    /** Verificar los dos campos de contraseña del formulario */
    const [passwordConfirm, setPasswordConfirm ] = useState(false);
    const passwordVerified = newUser.password !== "" && passwordConfirm === newUser.password;

    const handleAnyInput = (e,parameter) => {
        setNewUser({...newUser, [parameter]: e.target.value})
        setError("");
        setToast(null);
    }

    //console.log(newUser);

    

  return (
    <div className="leading-normal mi-fuente min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-3">
            FUTBOT
        </h1>
        
        {/** CREAR COMPONENTE */}
        {/** Alerta de error */}
        {error === "Email ya utilizado." && (
            <div className="toast-enter fixed bottom-4 right-4 z-50 max-w-sm
                            bg-orange-100 border-l-4 border-orange-500 text-orange-700 
                            p-4 rounded shadow-lg
                            text-3xl" 
                 role="alert"
                 key={toast.id}
            >
                    <div className='flex-1'>
                        <p className="font-bold">Revise sus datos nuevamente</p>
                        <p>{error}</p>
                    </div>              
            </div>
        )}

        {/** Alerta de error */}
        {error === "Error al enviar request." && (
            <div className="toast-enter fixed bottom-4 right-4 z-50 max-w-sm
                            bg-red-300 border-l-4 border-red-500 text-red-700 
                            p-4 rounded shadow-lg
                            text-3xl" 
                 role="alert"
                 key={toast.id}
            >
                    <div className='flex-1'>
                        <p className="font-bold">No se pudo completar el registro</p>
                        <p>{error}</p>
                    </div>              
            </div>
        )}

        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl ">
        {/** Formulario de registro */}
            <form onSubmit={handleSubmit} 
                  className="grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-4 gap-y-4">
                
                {/** CREAR COMPONENTE */}
                {/** usuario */}
                <fieldset className="contents">
                    <label
                        htmlFor="username"
                        className="text-4xl font-extrabold text-transparent text-right
                                    bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                    >
                        Nombre de usuario:
                    </label>
                    <input
                        id="username"
                        className="flex-1 min-w-0 border-2 py-2 px-3 rounded-md text-3xl"
                        onChange={(e) => handleAnyInput(e, "username")}
                        value={newUser.username}
                    />
                </fieldset>

                {/** email */}
                <fieldset className="contents">
                    <label
                        htmlFor="email"
                        className="text-4xl font-extrabold text-transparent text-right
                                    bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                    >
                        Email:
                    </label>
                    <input
                        id="email"
                        className="flex-1 min-w-0 border-2 py-2 px-3 rounded-md text-3xl"
                        type="text"
                        onChange={(e) => handleAnyInput(e, "email")}
                        value={newUser.email}
                    />
                </fieldset>

                {/** contraseña // "flex flex-row items-center gap-3 mb-4" */}
                <fieldset className= "contents"> 
                    <label
                        htmlFor="passw"
                        className="text-4xl font-extrabold text-transparent text-right
                                    bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                    >
                        Contraseña:
                    </label>
                    <input
                        id="passw"
                        className="flex-1 min-w-0 border-2 py-2 px-3 rounded-md text-3xl"
                        type="password"
                        onChange={(e) => handleAnyInput(e, "password")}
                        value={newUser.password}
                    />
                </fieldset>
                
                {/** contraseña verificacion */}
                <fieldset className="contents">
                    <label
                        htmlFor="password_verif"
                        className="text-4xl font-extrabold text-transparent text-right
                                    bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                    >
                        Repita contraseña:
                    </label>
                    <input
                        id="password_verif"
                        className="flex-1 min-w-0 border-2 py-2 px-3 rounded-md text-3xl"
                        type="password"
                        value = {passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                </fieldset>

                {/** club */}
                <fieldset className="contents">
                    <label
                        htmlFor="clubname"
                        className="text-4xl font-extrabold text-transparent text-right
                                    bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                    >
                        Nombre de club:
                    </label>
                    <input
                        id="clubname"
                        className="flex-1 min-w-0 border-2 py-2 px-3 rounded-md text-3xl"
                        type="text"
                        onChange={(e) => handleAnyInput(e, "clubname")}
                        value={newUser.clubname}
                    />
                </fieldset>

                {/** club */}
                <fieldset className="contents">
                    <label
                        htmlFor="avatar"
                        className="text-4xl font-extrabold text-transparent text-right
                                    bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                    >
                        Avatar:
                    </label>

                    <JpgInput id="avatar" 
                            onChange={(b64) => {
                                setNewUser((prev) => ({ ...prev, avatar: b64 }));
                                setError("");
                                setToast(null);
                            }} 
                    />
                </fieldset>

                {/** boton registro */}
                <button
                type="submit"
                disabled={!newUser.username || 
                        !newUser.email    || 
                        !newUser.password || 
                        !newUser.clubname || 
                        !newUser.avatar   || 
                        !passwordVerified}
                className="col-span-2 px-6 py-2 min-w-[120px] text-3xl text-center text-white
                    bg-violet-600 border border-violet-600 rounded
                    active:text-violet-500
                    hover:bg-transparent hover:text-violet-600
                    focus:outline-1 focus:ring
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
                ¿Ya tienes una cuenta?
            </h1>
            <Link
            to="/login"
            className="px-6 py-2 min-w-[120px] text-base text-center text-white bg-violet-600 border border-violet-600 rounded active:text-violet-500 hover:bg-transparent hover:text-violet-600 focus:outline-none focus:ring"
            >
                Iniciar sesión
            </Link>
        </div>

        <h2 className="text-xl font-semibold text-slate-300 mt-4">
        San Marino Famaf
        </h2>
    </div>
    );
}
