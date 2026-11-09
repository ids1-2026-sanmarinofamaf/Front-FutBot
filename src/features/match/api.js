import { apiClient } from "../../shared/api/client";

export const changeBehavior = async (matchId, playerId, behaviorId) => {
  if (
    matchId === undefined || matchId === null || matchId === "" ||
    playerId === undefined || playerId === null || playerId === "" ||
    behaviorId === undefined || behaviorId === null || behaviorId === ""
  ) {
    throw new Error(
      "Se requieren matchId, playerId y behaviorId para cambiar el comportamiento"
    );
  }

  return await apiClient(
    `/live_match/${encodeURIComponent(matchId)}/me/${encodeURIComponent(playerId)}/behavior`,
    {
      method: "PUT",
      body: JSON.stringify({ behavior_id: Number(behaviorId) }),
    }
  );
};

export const makeSubstitution = async (matchId, playerId, newPlayerId) => {
  if (
    matchId === undefined || matchId === null || matchId === "" ||
    playerId === undefined || playerId === null || playerId === "" ||
    newPlayerId === undefined || newPlayerId === null || newPlayerId === ""
  ) {
    throw new Error(
      "Se requieren matchId, playerId y newPlayerId para realizar una sustitución"
    );
  }

  return await apiClient(
    `/live_match/${encodeURIComponent(matchId)}/me/${encodeURIComponent(playerId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ new_player: Number(newPlayerId) }),
    }
  );
};


/**
 * Sends a direction for the authenticated club; the server determines its kick/save role.
 * The turn identifies which pending penalty the choice belongs to.
 * Outcomes arrive over WebSocket; this HTTP request only submits the choice.
 *
 * @param {string|number} matchId Active match identifier.
 * @param {number} turn Global shootout turn, from 1 to 6.
 * @param {"LEFT"|"CENTER"|"RIGHT"} side Chosen kick or save direction.
 */
export const submitPenaltyChoice = async (
  matchId,
  turn,
  side,
) => {
  return await apiClient(
    `/live_match/${encodeURIComponent(matchId)}/penalties/choices`,
    {
      method: "POST",
      body: JSON.stringify({turn, side}),
    }
  );
};