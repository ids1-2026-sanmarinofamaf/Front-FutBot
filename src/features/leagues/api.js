import { apiClient } from "../../shared/api/client";

export const sendNewL = async (newLData) => {
  return apiClient("/leagues", {
    method: "POST",
    body: JSON.stringify(newLData)
  });
};