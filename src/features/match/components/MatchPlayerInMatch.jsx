export function MatchPlayerInMatch({ players, playerNumbers }) {
  return (
    <>
      {players.filter(function (p) {
        return p.is_on_field
      }).map(function (p) {
        const snapped = {
          x: Math.floor(p.x) + 0.5,
          y: Math.floor(p.y) + 0.5
        }

        const pos = {
          x: 300 + (snapped.x / 40) * 1320,
          y: 150 + (snapped.y / 20) * 800
        }

        const color = p.team === 1 ? "blue" : "red"
        const number = playerNumbers[p.player_id]

        return (
          <svg>
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
          </svg>
        )
      })}
    </>
  )
}