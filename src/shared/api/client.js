import { getToken } from "../../features/auth/auth";

const BASE_URL = import.meta.env.VITE_API_URL; // Ajustar mediante variables de entorno

export const apiClient = async (endpoint, options = {}) => {
  
    //Se debe verificar que el token exista al menos
    const token = getToken();

    if (!token){
        throw new Error("No hay token de autenticación"); 
    } 
    else {

        const defaultHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (!response.ok) {

            if (response.status === 401) {
                console.error('Sesión expirada o token inválido');
                //limpieza del store de sesión 
                localStorage.removeItem("token");
                //crea evento para notificar que se debe cerrar la sesión
                window.dispatchEvent(new Event("auth:expired"));
            }
        
            // Intenta parsear el mensaje de error del backend, si existe
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.response || `Error HTTP: ${response.status}`);
        }

        // Manejo de respuestas 204 No Content
        if (response.status === 204) return null;

        return await response.json();
    }

};
