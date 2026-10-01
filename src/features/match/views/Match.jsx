// views/Match.jsx
import { SoccerField } from "./SoccerField"
import { MatchPlayerInMatch } from "../components/MatchPlayerInMatch"
import { Scoreboard } from "../components/Scoreboard"
import { MatchPlayerOut } from "../components/MatchPlayerOut"
import { Ball } from "../components/Ball"

/*const estado_partido = {
  actual_tic: 9,
  total_tic: 900,
  user1_goals: 5,
  user2_goals: 1,
  ball: {
    x: 20,
    y: 10
  },
  players: [
    { player_id: 1, x: 5, y: 10, team: 1, Side: "LEFT", onPitch: true, Formation: "1", Name: "Player 1", Goals: 2, RemainingSubstitutions: 3 },
    { player_id: 2, x: 10, y: 5, team: 1, Side: "LEFT", onPitch: true, Formation: "2", Name: "Player 2", Goals: 0, RemainingSubstitutions: 3 },
    { player_id: 3, x: 15, y: 8, team: 1, Side: "LEFT", onPitch: true, Formation: "3", Name: "Player 3", Goals: 1, RemainingSubstitutions: 3 },
    { player_id: 4, x: 8, y: 14, team: 1, Side: "LEFT", onPitch: false, Formation: "4", Name: "Player 4", Goals: 0, RemainingSubstitutions: 3 },
    { player_id: 5, x: 12, y: 16, team: 1, Side: "LEFT", onPitch: false, Formation: "5", Name: "Player 5", Goals: 0, RemainingSubstitutions: 3 },
    { player_id: 6, x: 18, y: 3, team: 1, Side: "LEFT", onPitch: false, Formation: "6", Name: "Player 6", Goals: 0, RemainingSubstitutions: 3 },

    { player_id: 7, x: 20, y: 12, team: 2, Side: "RIGHT", onPitch: true, Formation: "1", Name: "Player 7", Goals: 1, RemainingSubstitutions: 2 },
    { player_id: 8, x: 25, y: 15, team: 2, Side: "RIGHT", onPitch: true, Formation: "2", Name: "Player 8", Goals: 0, RemainingSubstitutions: 2 },
    { player_id: 9, x: 30, y: 10, team: 2, Side: "RIGHT", onPitch: true, Formation: "3", Name: "Player 9", Goals: 0, RemainingSubstitutions: 2 },
    { player_id: 10, x: 28, y: 4, team: 2, Side: "RIGHT", onPitch: false, Formation: "4", Name: "Player 10", Goals: 0, RemainingSubstitutions: 2 },
    { player_id: 11, x: 33, y: 6, team: 2, Side: "RIGHT", onPitch: false, Formation: "5", Name: "Player 11", Goals: 0, RemainingSubstitutions: 2 },
    { player_id: 12, x: 35, y: 17, team: 2, Side: "RIGHT", onPitch: false, Formation: "6", Name: "Player 12", Goals: 0, RemainingSubstitutions: 2 }
  ]
}
*/
export function Match({ estado_partido }) {
  return (
    <svg
      viewBox="0 0 1920 1080"
      style={{
        width: "100%",
        maxWidth: 1920,
        height: "auto",
        backgroundColor: "#063343"
      }}
    >
      <SoccerField />

      <MatchPlayerInMatch players={estado_partido.players} />

      <Scoreboard
        user1_goals={estado_partido.user1_goals}
        user2_goals={estado_partido.user2_goals}
        actual_tic={estado_partido.actual_tic}
        total_tic={estado_partido.total_tic}
      />

      <MatchPlayerOut players={estado_partido.players} />

      <Ball ball={estado_partido.ball} />
    </svg>
  )
}