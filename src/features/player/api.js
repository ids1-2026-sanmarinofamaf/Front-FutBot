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

/*
Mock para testing manual

export const createPlayer = async (playerData) => {
  // Validación de seguridad en capa de dominio antes de serializar
  if (!playerData || !playerData.name) {
    throw new Error("Datos de jugador inválidos o incompletos");
  }

  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Simulación de error (ej: validación fallida en servidor)
  // throw new Error("La suma de habilidades debe ser exactamente 300 (Simulación)");

  return {
    player_id: Math.floor(Math.random() * 1000) + 1,
    name: playerData.name,
    power: playerData.power,
    agility: playerData.agility,
    control: playerData.control,
    speed: playerData.speed,
    strength: playerData.strength
  };
  */