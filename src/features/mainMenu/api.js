import { apiClient } from "../../shared/api/client";

export const getRankingREST = async () => {
  return await apiClient("/ranking", {
    method: "GET",
  });
};