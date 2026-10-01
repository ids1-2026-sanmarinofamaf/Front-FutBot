import { apiClient } from "../../shared/api/client";

export const getPlayers = async () => {
    const data = await apiClient('/clubes/me/players', {
        method: 'GET',
    });
    return data.players_list || [];
};

export const createPlayer = async (playerData) => {
    if (!playerData || !playerData.name) {
        throw new Error("Datos de jugador inválidos o incompletos");
    }
    const data = await apiClient('/clubes/me/players', {
        method: 'POST',
        body: JSON.stringify(playerData)
    });
    return data;
};

