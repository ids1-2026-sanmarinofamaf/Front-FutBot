// views/Match.jsx
import { SoccerField } from "./SoccerField"
import { Scoreboard } from "../components/Scoreboard"

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

  //mock start
  const team1 = "Team 1"
  const team2 = "Team 2"
  const team1Score = 5
  const team2Score = 1
  const time = "90:00"
  const ball = { x: 20, y: 10 }
  //mock end

  return (
    <svg viewBox="0 0 1920 1080" style={{ width: "100%", maxWidth: 1920, height: "auto", backgroundColor: "#063343" }}>
      <SoccerField />

      <Scoreboard team1={team1} team2={team2} score1={team1Score} score2={team2Score} time={time}  />
    </svg>
    
  )
}