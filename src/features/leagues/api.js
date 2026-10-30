import { apiClient } from "../../shared/api/client";

export const sendNewL = async (newLData) => {
  return apiClient("/leagues", {
    method: "POST",
    body: JSON.stringify(newLData)
  });
};

/**
 * Une al usuario a una liga como participante.
 * `password` solo se envía si se recibe (ligas privadas).
 */
export const joinLeagueAsPlayer = async (idLiga, { roster, password } = {}) => {
  const body = { roster };
  if (password !== undefined) body.password = password;

  try {
    return await apiClient(`/leagues/${idLiga}/users`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  } catch (error) {
    // apiClient no expone el status ni el body: solo el mensaje del backend.
    // Se traduce a un código para que la vista no dependa del texto exacto.
    const message = error?.message ?? "";
    if (/already (participating|enrolled)/i.test(message)) {
      error.code = "ALREADY_PARTICIPATING";
    } else if (/incorrect password/i.test(message)) {
      error.code = "INCORRECT_PASSWORD";
    } else if (/full/i.test(message)) {
      error.code = "FULL";
    }

    throw error;
  }
};

/**
 * Solicita al backend el inicio de la liga
 */
export const startLeague = async (lID) => {
    return apiClient(`/leagues/${lID}`, {
        method: "PATCH",
        body: JSON.stringify({ state: "INICIADA" })
    });
};