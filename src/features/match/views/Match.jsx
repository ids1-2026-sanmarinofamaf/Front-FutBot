// views/Match.jsx
import { SoccerField } from "./SoccerField"
import { MatchPlayerInMatch } from "../components/MatchPlayerInMatch"
import { Scoreboard } from "../components/Scoreboard"

function toPixels(x, y) {
  return {
    x: 300 + (x / 40) * 1320,
    y: 150 + (y / 20) * 800,
  }
}



function snapToGridCenter(x, y) {
  return { x: Math.floor(x) + 0.5, y: Math.floor(y) + 0.5 }
}

export function Match() {

  //mock start
  const players = [
    { player_id: 1, x: 5, y: 10, team:1 , Formation: "1"},
    { player_id: 2, x: 34, y: 10, team:1, Formation: "2" },
    { player_id: 3, x: 20, y: 5, team:1, Formation: "3" },
    { player_id: 4, x: 10, y: 15, team:2, Formation: "1" },
    { player_id: 5, x: 30, y: 15, team:2, Formation: "2" },
    { player_id: 6, x: 20, y: 12, team:2, Formation: "3" },
  ]
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

      {players.map((p) => {
        const snapped = snapToGridCenter(p.x, p.y)
        const pos = toPixels(snapped.x, snapped.y)
        return <MatchPlayerInMatch key={p.player_id} x={pos.x} y={pos.y} team={p.team} Formation={p.Formation} />
      })}

      <Scoreboard team1={team1} team2={team2} score1={team1Score} score2={team2Score} time={time}  />
    </svg>
    
  )
}