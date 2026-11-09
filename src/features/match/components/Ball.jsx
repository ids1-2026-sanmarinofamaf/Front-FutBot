export function Ball({ ball }) {
  const pos = {
    x: 300 + (ball.x / 40) * 1320,
    y: 150 + (ball.y / 20) * 800
  }

  return (
    <g>
      <circle
        cx={pos.x}
        cy={pos.y}
        r={9}
        fill="white"
        stroke="#0F172A"
        strokeWidth={2}
      />

      <path
        d="M 0 -6 L 5 -2 L 3 4 H -3 L -5 -2 Z"
        transform={`translate(${pos.x} ${pos.y})`}
        fill="#0F172A"
      />
    </g>
  )
}