import { useState } from 'react';
import { sendDataToAPI, checkSession } from "../api.js";
import { removeToken, saveTokenLocalStorage } from "../auth";
import { useContext } from "react";
import { AuthContext } from "../AuthProvider.jsx";

import { Link } from "react-router-dom";

export default function Login() {

    const { setIsAuthenticated } = useContext(AuthContext);

    const [user, setUser] = useState({
        email: "",
        password: ""
    })

    const [error, setError] = useState("");
    const [toast, setToast] = useState(null); // { id } mientras se muestra

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setToast(null);

        try{
            const response = await sendDataToAPI(user); //envia endpoint
            if (response.status === 400) {
                setError("Email o contraseña incorrectos.");
                setToast({ id: Date.now() });
                return;
            }
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

            const data = await response.json();
            saveTokenLocalStorage(data); //guarda token

            const check =  await checkSession(removeToken);
            if(check){
                setError("")
                setIsAuthenticated(true);
            } 

        } catch (err) {
            console.log("Error al iniciar sesión:", err);
        }
    };

    const handleAnyInput = (e,parameter) => {
        setUser({...user, [parameter]: e.target.value})
        setError("");
        setToast(null);
    }
  return (
    <div className="leading-normal mi-fuente min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-3">
            FUTBOT
        </h1>

        {error === "Email o contraseña incorrectos." && (
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

        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md ">
        {/* Formulario de inicio de sesión */}
        <form onSubmit={handleSubmit} className="flex flex-col">
            <fieldset className="flex flex-row items-center gap-3 mb-4">
                <label
                    htmlFor="email"
                    className="text-4xl w-28 shrink-0 w-32 
                                font-extrabold text-transparent text-right 
                                bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 "
                >
                    Email:
                </label>
                <input
                    id="email"
                    className="flex-1 min-w-0 border-2 py-2 px-3 rounded-md text-3xl"
                    type="text"
                    onChange={(e) => handleAnyInput(e, "email")}
                    value={user.email}
                />
            </fieldset>

            <fieldset className="flex flex-row items-center gap-3 mb-4">
                <label
                    htmlFor="contraseña"
                    className="text-4xl w-28 shrink-0 w-32 
                                font-extrabold text-transparent text-right 
                                bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 "
                >
                    Contraseña:
                </label>
                <input
                    id="contraseña"
                    className="flex-1 min-w-0 border-2 py-2 px-3 rounded-md text-3xl"
                    type="password"
                    onChange={(e) => handleAnyInput(e, "password")}
                    value={user.password}
                />
            </fieldset>

            <button
            type="submit"
            disabled={!user.email || !user.password}
            className="px-6 py-2 min-w-[120px] text-3xl text-center text-white
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
            Iniciar sesión
            </button>
        </form>
        </div>

        <div className="flex flex-col mt-4">
            <h1 className="text-center text-2xl font-semibold text-gray-600">
                ¿Eres nuevo?
            </h1>
            <Link
            to="/register"
            className="px-6 py-2 min-w-[120px] text-base text-center text-white bg-violet-600 border border-violet-600 rounded active:text-violet-500 hover:bg-transparent hover:text-violet-600 focus:outline-none focus:ring"
            >
                Registrarse
            </Link>
        </div>

        <h2 className="text-xl font-semibold text-slate-300 mt-4">
        San Marino Famaf
        </h2>
    </div>
    );
}
