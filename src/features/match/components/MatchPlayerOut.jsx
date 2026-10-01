function toPixels(x, y) {
  return {
    x: 300 + (x / 40) * 1320,
    y: 150 + (y / 20) * 800,
  }
}

export function MatchPlayerOut({ players }) {
  return (
    <>
      <StarterColumn players={players.filter(function (p) { return p.team === 1 && p.onPitch })} x={40} />
      <StarterColumn players={players.filter(function (p) { return p.team === 2 && p.onPitch })} x={1790} />

      <BenchRow players={players.filter(function (p) { return p.team === 1 && !p.onPitch })} startX={320} direction={1} />
      <BenchRow players={players.filter(function (p) { return p.team === 2 && !p.onPitch })} startX={1550} direction={-1} />
    </>
  )
}

function StarterColumn({ players, x }) {
  return (
    <>
      {players.map(function (p, i) {
        return <PlayerSquare key={p.player_id} player={p} x={x} y={150 + i * 100} size={90} />
      })}
    </>
  )
}

function BenchRow({ players, startX, direction }) {
  return (
    <>
      {players.map(function (p, i) {
        return <PlayerSquare key={p.player_id} player={p} x={startX + direction * i * 80} y={40} size={70} />
      })}
    </>
  )
}

function PlayerSquare({ player, x, y, size }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={player.team === 1 ? "blue" : "red"}
        opacity={player.onPitch ? 1 : 0.5}
        stroke="white"
        strokeWidth="2"
      />
      <text
        x={x + size / 2}
        y={y + size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="14"
        fontWeight="bold"
      >
        {player.Name}
      </text>
    </g>
  )
}