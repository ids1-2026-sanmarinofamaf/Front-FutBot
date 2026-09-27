//import { Children, createContext } from "react";
import { createContext, useState, useEffect } from "react";
import {getToken} from "../auth/auth.js"

{/*An AuthProvider is the frontend component that supplies authentication context 
    across a web application. It centralises login state, logout handling, and 
    session awareness so components can react consistently to whether a user is 
    authenticated. In practice, it prevents scattered authentication logic from 
    being rebuilt in each screen. */}

export const AuthContext = createContext(); //se usa para compartir datos

//Componente para verificar token existente o no, y valido o no.
export const AuthProvider = ({ children }) => {
    
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); //Define en tiempo real que vista usar

    useEffect(() => {

        const verifySession = async () => {
            
            //Hay token?
            const token = getToken(); 
            if (!token) {
                setLoading(false);
                return;
            }

            //Es válido? Borra si no lo es
            const response = await checkSession();
            if (response.ok) {
                setIsAuthenticated(true);
            } else {
                localStorage.removeItem("token");
                setIsAuthenticated(false);
            }

            setLoading(false);
        };

        verifySession();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
            {loading ? <p>Cargando...</p> : children}
        </AuthContext.Provider>
    );

}