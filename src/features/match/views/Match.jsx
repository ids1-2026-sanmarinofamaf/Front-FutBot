import { SoccerField } from "./SoccerField"
import { MatchPlayerInMatch } from "../components/MatchPlayerInMatch"
import { Scoreboard } from "../components/Scoreboard"
import { MatchPlayerOut } from "../components/MatchPlayerOut"
import { Ball } from "../components/Ball"
import { ExitMatchButton } from "../components/ExitMatchButton"

// Para identificar a cada jugador en la cancha
function buildPlayerNumbers(players) {
  const playerNumbers = {}

  let countA = 0
  let countB = 0

  players.forEach(function (player) {
    if (!player.is_on_field) {
      return
    }

    if (player.team === "A") {
      countA = countA + 1
      playerNumbers[player.player_id] = countA
    } else {
      countB = countB + 1
      playerNumbers[player.player_id] = countB
    }
  })

  return playerNumbers
}

export function Match({ estado_partido }) {
  const playerNumbers = buildPlayerNumbers(estado_partido.players)

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