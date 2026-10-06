import { apiClient } from "../../shared/api/client";

export const sendNewFM = async (newFMData) => {
  return apiClient("/friendly_games", {
    method: "POST",
    body: JSON.stringify(newFMData)
  });
};

export const joinFGAsPlayer = async (fgID, roster) => {
  try {
    return await apiClient(`/friendly_games/${fgID}/users`, {
      method: "POST",
      body: JSON.stringify({ roster })
    });
  } catch (error) {
    // apiClient, por como devuelve los errores,
    // devuelve "Error HTTP: 409" y no expone el body.
    if (error.message === "User is already participating in this friendly game") {
      error.code = "ALREADY_PARTICIPATING";
    }
    if (error.message === "Friendly game is full") {
      error.code = "FULL";
    }

    throw error;
  }
}

/**
 * Obtiene los datos del usuario logueado (incluye el nombre del club)
 */
export const getCurrentUser = async () => {
    return apiClient("/users/me", {
        method: "GET",
    });
};

/**
 * Solicita al backend el inicio del partido amistoso
 */
export const startFriendlyGame = async (fgID) => {
    return apiClient(`/friendly_games/${fgID}`, {
        method: "PATCH",
        body: JSON.stringify({ state: "JUGANDO" })
    });
};