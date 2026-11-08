/**
 * Utiliza la información de un jugador y la formatea
 * @param player: datos del jugador
 * @param behavior: lista de comportamientos
 * @param onStarterChange: lógica para cambiar titulares del roster
 * @param onBehaviorChange: lógica para cambiar comportamientos del roster
 * @param onSlotChange: lógica para cambiar slots del roster
 * @param occupiedSlots: slots ocupados
 * @returns Componente de jugador
 */
export default function RosterPlayer({ player, behaviors, onStarterChange, onBehaviorChange, onSlotChange, occupiedSlots, disablePromotion = false }) {

  //Filtra los comportamientos para obtener el que tiene el jugador
  const behavior = behaviors.find(
    item => item.behavior_id === player.initial_behavior_id
  )

  return (
    <li className="min-h-60 rounded-lg border border-slate-600 bg-slate-700 p-3 space-y-1">

      <p className="font-semibold text-slate-100">
        {player.name}
      </p>

      {player.is_starter && (
        <>
          <label className="flex flex-col gap-2">

            {/* Formulario para posición/slot */}
            Posición:
            <select
              value={player.slot ?? ""}
              disabled={!player.is_starter}
              onChange={event => onSlotChange(player.player_id, event.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Sin posición</option>
              {["left", "center", "right"].map(slot => (
                <option key={slot} value={slot} disabled={occupiedSlots.includes(slot)}>{slot}</option>
              ))}
            </select>
            
          </label>

          {/* Formulario para comportamiento inicial */}
          <label className="flex flex-col gap-2">
            Comportamiento inicial:
            <select
              value={player.initial_behavior_id ?? ""}
              disabled={!player.is_starter}
              onChange={event => onBehaviorChange(player.player_id, event.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Sin comportamiento</option>
              {player.initial_behavior_id != null && !behavior && (
                <option value={player.initial_behavior_id} disabled>
                  Comportamiento {player.initial_behavior_id}
                </option>
              )}
              {behaviors.map(item => (
                <option key={item.behavior_id} value={item.behavior_id}>{item.name}</option>
              ))}
            </select>
          </label>

        </>
      )}

      <button
        type="button"
        onClick={() => onStarterChange(player.player_id)}
        disabled={!player.is_starter && disablePromotion}
        className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {player.is_starter ? "Pasar a suplente" : "Pasar a titular"}
      </button>

    </li>
  )
}
