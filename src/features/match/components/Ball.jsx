export function Ball({ ball }) {
  const snapped = { x: Math.floor(ball.x) + 0.5, y: Math.floor(ball.y) + 0.5 }
  const pos = { x: 300 + (snapped.x / 40) * 1320, y: 150 + (snapped.y / 20) * 800 }

  return <circle cx={pos.x} cy={pos.y} r={3.3} fill="white" stroke="black" strokeWidth="1" />
}