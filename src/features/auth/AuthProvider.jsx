//import { Children, createContext } from "react";
import { createContext, useState, useEffect } from "react";
import {getToken} from "./auth.js"
import { checkSession } from "./api.js";
import useWebSocket from "../../shared/hooks.js";

const WS_BASE_URL = import.meta.env.WS_URL;

{/*An AuthProvider is the frontend component that supplies authentication context 
    across a web application. It centralises login state, logout handling, and 
    session awareness so components can react consistently to whether a user is 
    authenticated. In practice, it prevents scattered authentication logic from 
    being rebuilt in each screen. */}

export const AuthContext = createContext(); //se usa para compartir datos, como un pizarron

//Componente para verificar token existente o no, y valido o no.
//Inicia conexión a ws de sesion
export const AuthProvider = ({ children }) => {
    
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); //Define en tiempo real que vista usar
    const [isSessionConnected, setIsSessionConnected] = useState(false);
    
    const logout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
    };

    //MANEJO DE WEBSOCKET
    const [wsUrl, setWsUrl] = useState(null);

    useWebSocket(wsUrl, {
        onOpen: () => {
            console.log("WebSocket conectado");
            setIsSessionConnected(true);
        },

        onMessage: (data) => {
            console.log("Datos:", data);
        }
    });

    const connectWebSocket = (token) => {
        setWsUrl(`${WS_BASE_URL}/ws/sessions?token=${token}`);
    };
    // --------------

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
                if (response.ok) {
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

    return (
        //Todo el que esté dentro de esta sala puede consultar este pizarrón. 
        // En él dejo escrito si el usuario está autenticado y cómo cambiar ese estado.
        <AuthContext.Provider 
            value={{ isAuthenticated, setIsAuthenticated, logout, 
                    isSessionConnected, setIsSessionConnected, connectWebSocket }}>
            {loading ? (
                <p data-testid="loading">Cargando...</p>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );

}