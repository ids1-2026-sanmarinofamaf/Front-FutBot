/**
 * Componente que renderiza en SVG los jugadores activos en la cancha.
 * Dibuja cada jugador como un círculo de color (azul para equipo A, rojo para B)
 * con su dorsal fijo (shirt_number) centrado.
 *
 * @param {Object} props
 * @param {Array<Object>} props.players - Lista de jugadores con sus posiciones y estado en cancha.
 * @param {Object} [props.playerNumbers] - Mapeo de player_id a dorsal fijo.
 * @param {number|string|null} [props.highlightedPlayerId] - ID del jugador a resaltar con un color distinto.
 * @returns {JSX.Element}
 */
export function MatchPlayerInMatch({
  players,
  playerNumbers = {},
  highlightedPlayerId = null,
}) {
  return (
    <>
      {players
      //filtra los jugadores titulares
        .filter(function (p) {
          return p.is_on_field
        })
        .map(function (p) {
          const pos = {
            x: 300 + (p.x / 40) * 1320,
            y: 150 + (p.y / 20) * 800
          }
          //pinta cada jugador con un color según su equipo (o el color resaltado) y dibuja su número en el centro del círculo
          const isHighlighted =
            highlightedPlayerId !== null &&
            highlightedPlayerId !== undefined &&
            String(p.player_id) === String(highlightedPlayerId)
          const color = isHighlighted
            ? "#F2B035"
            : p.team === "A"
              ? "#5BB5D9"
              : "#D98E32"
          const borderColor = isHighlighted
            ? "#8A6318"
            : p.team === "A"
              ? "#3D91B2"
              : "#B57226"
          const number = p.shirt_number ?? playerNumbers[p.player_id]

          return (
            <g key={p.player_id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={20}
                fill={color}
                stroke={borderColor}
                strokeWidth={5}
              />

              <text
                x={pos.x}
                y={pos.y}
                fill={borderColor}
                fontSize={40}
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {number}
              </text>
            </g>
          )
        })}
    </>
  )
}