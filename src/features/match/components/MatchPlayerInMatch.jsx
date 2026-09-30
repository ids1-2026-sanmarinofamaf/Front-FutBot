// components/PlayerInMatch.jsx

export function MatchPlayerInMatch({ x, y, team, Formation }) {
  const color = team === 1 ? "blue" : "red"

  return (
    <>
      <circle
        cx={x}
        cy={y}
        r={8.25}
        fill={color}
      />

      <text
        x={x}
        y={y}
        fill="black"
        fontSize={12}
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {Formation}
      </text>
    </>
  )
}