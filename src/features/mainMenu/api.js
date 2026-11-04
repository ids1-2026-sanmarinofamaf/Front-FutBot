import { apiClient } from "../../shared/api/client";

export const getRankingREST = async (newLData) => {
  return apiClient("/ranking", {
    method: "GET",
    body: JSON.stringify(newLData)
  });
};