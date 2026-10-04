import { apiClient } from "../../shared/api/client";

export const sendNewFM = async (newFMData) => {
  return apiClient("/friendly_games", {
    method: "POST",
    body: JSON.stringify(newFMData)
  });
};