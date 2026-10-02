function toPixels(x, y) {
  return {
    x: 300 + (x / 40) * 1320,
    y: 150 + (y / 20) * 800,
  }
}

export function MatchPlayerOut({ players, playerNumbers }) {
  return (
    <>
      <StarterColumn
        players={players.filter(function (p) { return p.team === 1 && p.is_on_field })}
        x={40}
        playerNumbers={playerNumbers}
      />

      <StarterColumn
        players={players.filter(function (p) { return p.team === 2 && p.is_on_field })}
        x={1790}
        playerNumbers={playerNumbers}
      />

      <BenchRow
        players={players.filter(function (p) { return p.team === 1 && !p.is_on_field })}
        startX={320}
        direction={1}
        playerNumbers={playerNumbers}
      />

      <BenchRow
        players={players.filter(function (p) { return p.team === 2 && !p.is_on_field })}
        startX={1550}
        direction={-1}
        playerNumbers={playerNumbers}
      />
    </>
  )
}

function StarterColumn({ players, x, playerNumbers }) {
  return (
    <>
      {players.map(function (p, i) {
        return (
          <PlayerSquare
            key={p.player_id}
            player={p}
            x={x}
            y={150 + i * 100}
            size={90}
            number={playerNumbers[p.player_id]}
          />
        )
      })}
    </>
  )
}

function BenchRow({ players, startX, direction, playerNumbers }) {
  return (
    <>
      {players.map(function (p, i) {
        return (
          <PlayerSquareOut
            key={p.player_id}
            player={p}
            x={startX + direction * i * 80}
            y={40}
            size={70}
            number={playerNumbers[p.player_id]}
          />
        )
      })}
    </>
  )
}

function PlayerSquare({ player, x, y, size, number }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={player.team === 1 ? "blue" : "red"}
        opacity={player.is_on_field ? 1 : 0.5}
        stroke="white"
        strokeWidth="2"
      />

      <text
        x={x + size / 2}
        y={y + size / 2 - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="14"
        fontWeight="bold"
      >
        {player.Name}
      </text>

      <text
        x={x + size / 2}
        y={y + size / 2 + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="13"
      >
        Number: {number}
      </text>
    </g>
  )
}



function PlayerSquareOut({ player, x, y, size, number }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={player.team === 1 ? "blue" : "red"}
        opacity={player.is_on_field ? 1 : 0.5}
        stroke="white"
        strokeWidth="2"
      />

      <text
        x={x + size / 2}
        y={y + size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="15"
        fontWeight="bold"
      >
        {player.Name}
      </text>

    </g>
  )
}