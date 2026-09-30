//import { Children, createContext } from "react";
import { createContext, useState, useEffect } from "react";
import {getToken} from "./auth.js"
import { checkSession } from "./api.js";

{/*An AuthProvider is the frontend component that supplies authentication context 
    across a web application. It centralises login state, logout handling, and 
    session awareness so components can react consistently to whether a user is 
    authenticated. In practice, it prevents scattered authentication logic from 
    being rebuilt in each screen. */}

export const AuthContext = createContext(); //se usa para compartir datos, como un pizarron

//Componente para verificar token existente o no, y valido o no.
export const AuthProvider = ({ children }) => {
    
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); //Define en tiempo real que vista usar
    
    const logout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
    };

    useEffect(() => {

        const verifySession = async () => {
            
            //Hay token?
            const token = getToken(); 

            if (!token) {
                setLoading(false);
                return;
            }

            //Es válido? Borra si no lo es
            try{
                const response = await checkSession(logout);
                if (response) {
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.log("No se pudo verificar la autenticación:", error);
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, []);

    //Escucha el aviso del websocket para cerrar sesión
    useEffect(() => {
        const onExpired = () => logout();
        window.addEventListener("auth:expired", onExpired);
        return () => window.removeEventListener("auth:expired", onExpired);
    }, []);

    {/**Analogar este codigo con consultas a un pizarron en una sala es útil:
            Todo el que esté dentro de esta sala puede consultar este pizarrón. 
            En el dejo escrito si el usuario está autenticado y cómo cambiar ese estado."
        */} 
    return (
        
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, logout, }}>
            {loading ? (
                <p data-testid="loading">Cargando...</p>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );

}