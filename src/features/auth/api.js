import { apiClient } from "../../shared/api/client";

//fetch hardcodeado intencionalmente (apiClient requiere token)
export const sendDataToAPI = async (user) => {
  return fetch(`${import.meta.env.VITE_API_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
};
export const checkSession = async (logout) => {

    try {
        return await apiClient("/users/me", {
            method: "GET"
        });
    } catch (error) {
        if (error.message === "Sesión expirada o token inválido") {
            logout();
        }

        throw error;
    }
};

