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

export const leaveLeagueAsPlayer = async (leagueId) => {
  try {
    return await apiClient(`/leagues/${leagueId}/users/me`, {
      method: "DELETE",
    });
  } catch (error) {
    const message = error?.message ?? "";

    if (/creator cannot leave the league/i.test(message)) {
      error.code = "CREATOR_CANNOT_LEAVE";
    } else if (/league has already started/i.test(message)) {
      error.code = "LEAGUE_ALREADY_STARTED";
    } else if (/league does not exist/i.test(message)) {
      error.code = "LEAGUE_NOT_FOUND";
    } else if (/user is not participating in this league/i.test(message)) {
      error.code = "NOT_PARTICIPATING";
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

/**
 * Llama a /users/me y retorna el objeto con los 3 datos de sesión.
 */
export const getUserSessionInfo = async () => {

  const response = await apiClient("/users/me", {
      method: "GET",
  });

  const { user_id, user_name, user_email } = response;

  return {
      user_id,
      user_name,
      user_email,
  };
};
