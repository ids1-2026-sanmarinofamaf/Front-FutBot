import { SoccerField } from "./SoccerField"
import { MatchPlayerInMatch } from "../components/MatchPlayerInMatch"
import { Scoreboard } from "../components/Scoreboard"
import { MatchPlayerOut } from "../components/MatchPlayerOut"
import { Ball } from "../components/Ball"
import { ExitMatchButton } from "../components/ExitMatchButton"


/*
  const estado_partido = {
  actual_tic: 9,
  total_tic: 900,
  user1_goals: 5,
  user2_goals: 1,

  ball: {
    x: 20,
    y: 10
  },

  players: [
    { player_id: 1, x: 5, y: 10, team: 1, is_on_field: true},
    { player_id: 2, x: 10, y: 5, team: 1, is_on_field: true},
    { player_id: 3, x: 15, y: 8, team: 1,  is_on_field: true },
    { player_id: 4, x: 8, y: 14, team: 1,  is_on_field: false},
    { player_id: 5, x: 12, y: 16, team: 1, is_on_field: false},
    { player_id: 6, x: 18, y: 3, team: 1, is_on_field: false},

    { player_id: 7, x: 20, y: 12, team: 2, is_on_field: true},
    { player_id: 8, x: 25, y: 15, team: 2, is_on_field: true},
    { player_id: 9, x: 30, y: 10, team: 2, is_on_field: true},
    { player_id: 10, x: 28, y: 4, team: 2,  is_on_field: false},
    { player_id: 11, x: 33, y: 6, team: 2,  is_on_field: false},
    { player_id: 12, x: 35, y: 17, team: 2,  is_on_field: false}
  ]
};
  */

export function Match({ estado_partido }) {
  const playerNumbers = {}

  estado_partido.players.forEach(function (player, i) {
    playerNumbers[player.player_id] = (i % 3) + 1
  })

  return (
    <div className="relative">
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

        <MatchPlayerInMatch
          players={estado_partido.players}
          playerNumbers={playerNumbers}
        />

        <Scoreboard estado_partido={estado_partido} />

        <MatchPlayerOut
          players={estado_partido.players}
          playerNumbers={playerNumbers}
        />

        <Ball ball={estado_partido.ball} />
      </svg>

      <ExitMatchButton />
    </div>
  )
}