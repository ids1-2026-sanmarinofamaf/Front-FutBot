// views/Match.jsx
import { SoccerField } from "./SoccerField"

function toPixels(x, y) {
  return {
    x: 300 + (x / 40) * 1320,
    y: 150 + (y / 20) * 820,
  }
}

function snapToGridCenter(x, y) {
  return { x: Math.floor(x) + 0.5, y: Math.floor(y) + 0.5 }
}

export function Match() {
  const players = [
    { player_id: 1, x: 5, y: 10, team:1 },
    { player_id: 2, x: 34, y: 10, team:2 },
  ]
  const ball = { x: 20, y: 10 }

  return (
    <svg viewBox="0 0 1920 1080" style={{ width: "100%", maxWidth: 1920, height: "auto", backgroundColor: "#063343" }}>
      <SoccerField />

    </svg>
  )
}