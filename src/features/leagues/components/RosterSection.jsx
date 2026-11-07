import RosterPlayer from "./RosterPlayer"

/**
 * Mapea lista de jugadores y las une en un componente único
 * @param title: nombre de la seleccion de jugadores
 * @param players: lista de jugadores con sus respectivos datos
 * @param behavior: lista de todos los comportamientos del usuario
 * @param onStarterChange: lógica para cambiar titulares del roster
 * @param onBehaviorChange: lógica para cambiar comportamientos del roster
 * @param onSlotChange: lógica para cambiar slots del roster
 * @param disablePromotion: valor booleano para habilitar/deshabilitar pasar jugador de suplente a titular
 * @returns Componente con jugadores
 */
export default function RosterSection({ title, players, behaviors, onStarterChange, onBehaviorChange, onSlotChange, disablePromotion = false }) {
  return (
    <section className="space-y-3">

      <h3 className="text-xl font-semibold text-slate-100">
        {title}
      </h3>

      <ul className="space-y-3">
        {players.map((player) => (
          <RosterPlayer
            key={player.player_id}
            player={player}
            disablePromotion={disablePromotion}
            behaviors={behaviors}
            onStarterChange={onStarterChange}
            onBehaviorChange={onBehaviorChange}
            onSlotChange={onSlotChange}
            occupiedSlots={players.filter(item => item.is_starter && item.player_id !== player.player_id).map(item => item.slot)}
          />
        ))}
      </ul>

    </section>
  )
}
