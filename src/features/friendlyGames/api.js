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
