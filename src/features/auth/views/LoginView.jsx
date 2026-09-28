import { useState } from 'react';
import { sendDataToAPI, checkSession } from "../api.js";
import { removeToken, saveTokenLocalStorage } from "../auth";
import { useContext } from "react";
import { AuthContext } from "../AuthProvider.jsx";

export default function Login() {

    const { setIsAuthenticated } = useContext(AuthContext);

    const [user, setUser] = useState({
        email: "",
        password: ""
    })

    const handleSubmit = async (event) => {
        event.preventDefault();

        try{
            const response = await sendDataToAPI(user); //envia endpoint
            saveTokenLocalStorage(response); //guarda token

            const check =  await checkSession(removeToken);
            if(check){
                setIsAuthenticated(true);
            } 

        } catch (error) {
            console.log("Error al iniciar sesión:", error);
        }
    };

    const handleAnyInput = (e,parameter) => {
        setUser({...user, [parameter]: e.target.value})
    }
    
  return (
    <div className="leading-normal mi-fuente text-4xl min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">

        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            FUTBOT
        </h1>

        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center">

            {/*Formulario de inicio de sesión*/}
            <form 
                onSubmit={handleSubmit}
                className='flex flex-col'
            >

                <fieldset>
                    <label
                        htmlFor='email'
                        className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                        Email: 
                    </label>

                    <input 
                        id='email'
                        type="text"
                        onChange={(e) => handleAnyInput(e, "email")}
                        value = {user.email}
                    />
                </fieldset>

                <fieldset>
                    <label 
                        htmlFor='contraseña'
                        className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
                        Contraseña: 
                    </label>

                    <input 
                        id='contraseña'
                        type="text"
                        onChange={(e) => handleAnyInput(e, "password")}
                        value = {user.password}
                        />                
                </fieldset>

                <button
                    type='submit'
                    disabled={!user.email || !user.password}
                    className="px-6 py-2 min-w-[120px] text-center text-white 
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
                >Iniciar sesión</button>

            </form>
            
        </div>
        
        <div className = "flex flex-col " >

            <button 
        
                className="px-6 py-2 min-w-[120px] text-center text-white bg-violet-600 border border-violet-600 rounded active:text-violet-500 hover:bg-transparent hover:text-violet-600 focus:outline-none focus:ring">
                Registrarse</button>

        </div>


        <h2 className="text-xl font-semibold text-slate-300">
        San Marino Famaf
        </h2>

    </div>
  )
}
