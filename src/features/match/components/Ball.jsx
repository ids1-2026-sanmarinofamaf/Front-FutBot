export function Ball({ ball }) {
  const pos = {
    x: 300 + (ball.x / 40) * 1320,
    y: 150 + (ball.y / 20) * 800
  }

  return (
    <g>
      {/* Ground shadow. */}
      <ellipse
        cx={pos.x}
        cy={pos.y + 4}
        rx={10}
        ry={8}
        fill="#0F172A"
        opacity={0.2}
      />

      <circle
        cx={pos.x}
        cy={pos.y}
        r={9}
        fill="#E6ECEF"
        stroke="#0F172A"
        strokeWidth={2}
      />

      {/* Upper reflection suggests a rounded surface. */}
      <path
        d="M -5 -4 A 6 6 0 0 1 5 -4"
        transform={`translate(${pos.x} ${pos.y})`}
        fill="none"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Dark panel remains above the reflection. */}
      <path
        d="M 0 -6 L 5 -2 L 3 4 H -3 L -5 -2 Z"
        transform={`translate(${pos.x} ${pos.y})`}
        fill="#0F172A"
      />
    </g>
  )
}