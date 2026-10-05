export function MatchPlayerInMatch({ players, playerNumbers }) {
  return (
    <>
      {players
      //filtra los jugadores titulares
        .filter(function (p) {
          return p.is_on_field
        })
        .map(function (p) {
          const pos = {
            x: 300 + ((p.x + 0.5) / 40) * 1320,
            y: 150 + ((p.y + 0.5) / 20) * 800
          }
          //pinta cada jugador con un color según su equipo y dibuja su número en el centro del círculo
          const color = p.team === "A" ? "blue" : "red"
          const number = playerNumbers[p.player_id]

          return (
            <g key={p.player_id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={8.25}
                fill={color}
              />

              <text
                x={pos.x}
                y={pos.y}
                fill="black"
                fontSize={12}
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