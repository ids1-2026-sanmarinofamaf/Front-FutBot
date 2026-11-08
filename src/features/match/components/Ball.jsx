export function Ball({ ball }) {
  const pos = {
    x: 300 + (ball.x / 40) * 1320,
    y: 150 + (ball.y / 20) * 800
  }

  return <circle cx={pos.x} cy={pos.y} r={3.3} fill="white" stroke="black" strokeWidth="1" />
}