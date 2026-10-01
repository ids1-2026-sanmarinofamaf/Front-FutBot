// views/Match.jsx
import { SoccerField } from "./SoccerField"
import { MatchPlayerInMatch } from "../components/MatchPlayerInMatch"
import { Scoreboard } from "../components/Scoreboard"
import { MatchPlayerOut } from "../components/MatchPlayerOut"

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
    { player_id: 1, x: 5, y: 10, team:1 , Formation: "1", Name: "Player 1", OnField: true },
    { player_id: 2, x: 34, y: 10, team:1, Formation: "2", Name: "Player 2", OnField: true },
    { player_id: 3, x: 20, y: 5, team:1, Formation: "3", Name: "Player 3", OnField: true },
    { player_id: 4, x: 10, y: 15, team:1, Formation: "4", Name: "Player 4", OnField: false },
    { player_id: 5, x: 30, y: 15, team:1, Formation: "5", Name: "Player 5", OnField: false },
    { player_id: 6, x: 20, y: 12, team:1, Formation: "6", Name: "Player 6", OnField: false },
    { player_id: 7, x: 6, y: 10, team:2 , Formation: "1", Name: "Player 7", OnField: true },
    { player_id: 8, x: 7, y: 10, team:2, Formation: "2", Name: "Player 8", OnField: true },
    { player_id: 9, x: 8, y: 5, team:2, Formation: "3", Name: "Player 9", OnField: true },
    { player_id: 10, x: 10, y: 15, team:2, Formation: "4", Name: "Player 10", OnField: false },
    { player_id: 11, x: 30, y: 15, team:2, Formation: "5", Name: "Player 11", OnField: false },
    { player_id: 12, x: 20, y: 12, team:2, Formation: "6", Name: "Player 12", OnField: false },
  ]
  const team1 = "Team 1"
  const team2 = "Team 2"
  const user1_goals = 5
  const user2_goals = 1
  const actual_tic = "9"
  const total_tic = "900"

  //mock end

  return (
  <svg viewBox="0 0 1920 1080" style={{ width: "100%", maxWidth: 1920, height: "auto", backgroundColor: "#063343" }}>
    <SoccerField />

    <MatchPlayerInMatch players={players} />

    <Scoreboard team1={team1} team2={team2} user1_goals={user1_goals} user2_goals={user2_goals} actual_tic={actual_tic} total_tic={total_tic} />
    <MatchPlayerOut players={players} />
  </svg>
)
}