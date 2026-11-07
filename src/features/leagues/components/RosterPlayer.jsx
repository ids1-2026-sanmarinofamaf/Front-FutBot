/**
 * Utiliza la información de un jugador y la formatea
 * @param player: datos del jugador
 * @param behavior: lista de comportamientos
 * @returns Componente de jugador
 */
export default function RosterPlayer({ player, behaviors }) {

  //Filtra los comportamientos para obtener el que tiene el jugador
  const behavior = behaviors.find(
    item => item.behavior_id === player.initial_behavior_id
  )

  return (
    <li className="min-h-60 rounded-lg border border-slate-600 bg-slate-700 p-3 space-y-1">

      <p className="font-semibold text-slate-100">
        {player.name}
      </p>

      <p>
        Posición: {player.slot ?? "Sin posición"}
      </p>

      <p>
        Comportamiento inicial: {
          player.initial_behavior_id == null
            ? "Sin comportamiento"
            : behavior?.name ?? `Comportamiento ${player.initial_behavior_id}`
        }
      </p>

    </li>
  )
}
