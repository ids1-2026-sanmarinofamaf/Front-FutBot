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