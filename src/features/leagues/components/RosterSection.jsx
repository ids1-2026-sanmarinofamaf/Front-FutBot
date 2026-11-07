import RosterPlayer from "./RosterPlayer"

/**
 * Mapea lista de jugadores y las une en un componente único
 * @param title: nombre de la seleccion de jugadores
 * @param players: lista de jugadores con sus respectivos datos
 * @param behavior: lista de todos los comportamientos del usuario
 * @returns Componente con jugadores
 */
export default function RosterSection({ title, players, behaviors }) {
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
            behaviors={behaviors}
          />
        ))}
      </ul>

    </section>
  )
}