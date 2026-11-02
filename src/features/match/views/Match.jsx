
import { useState } from "react"
import { useParams } from "react-router-dom"
import { SoccerField } from "./SoccerField"
import { MatchPlayerInMatch } from "../components/MatchPlayerInMatch"
import { Scoreboard } from "../components/Scoreboard"
import { MatchPlayerOut } from "../components/MatchPlayerOut"
import { Ball } from "../components/Ball"
import { ExitMatchButton } from "../components/ExitMatchButton"
import { ChangeBehaviorMenu } from "../components/ChangeBehaviorMenu"
import { MatchPause } from "../components/MatchPause"
import { getBehaviors } from "../../behaviors/api.js"
import { changeBehavior } from "../api.js"

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

export function Match({ estado_partido, matchId, pausa }) {
  const params = useParams()
  const effectiveMatchId = matchId ?? params?.matchId

  const [selectedStarter, setSelectedStarter] = useState(null)
  const [behaviors, setBehaviors] = useState(null)
  const [isLoadingBehaviors, setIsLoadingBehaviors] = useState(false)
  const [isSubmittingBehavior, setIsSubmittingBehavior] = useState(false)
  const [menuError, setMenuError] = useState(null)
  const [assignedBehaviorsByPlayer, setAssignedBehaviorsByPlayer] = useState({})

  const playerNumbers = buildPlayerNumbers(estado_partido.players)

  async function handleSelectStarter(starter) {
    setMenuError(null)
    setSelectedStarter({
      ...starter,
      currentBehaviorId: assignedBehaviorsByPlayer[starter.player_id] ?? null,
    })

    if (behaviors === null && !isLoadingBehaviors) {
      try {
        setIsLoadingBehaviors(true)
        const data = await getBehaviors()
        const list = Array.isArray(data) ? data : data?.behaviors_list || []
        setBehaviors(list)
      } catch (err) {
        setMenuError(
          err.message || "Error al obtener los comportamientos disponibles"
        )
      } finally {
        setIsLoadingBehaviors(false)
      }
    }
  }

  async function handleConfirmBehaviorChange(behaviorId) {
    if (!selectedStarter) {
      return
    }

    try {
      setIsSubmittingBehavior(true)
      setMenuError(null)

      await changeBehavior(
        effectiveMatchId,
        selectedStarter.player_id,
        behaviorId
      )

      setAssignedBehaviorsByPlayer(function (previous) {
        return {
          ...previous,
          [selectedStarter.player_id]: behaviorId,
        }
      })
      setSelectedStarter(null)
    } catch (err) {
      setMenuError(
        err.message || "No se pudo cambiar el comportamiento del jugador"
      )
    } finally {
      setIsSubmittingBehavior(false)
    }
  }

  function handleCancelBehaviorChange() {
    setSelectedStarter(null)
    setMenuError(null)
  }

  return (
    <div>
      <div className="relative w-full max-w-[1920px] aspect-[16/9]">
        <svg
          viewBox="0 0 1920 1080"
          className="absolute inset-0 w-full h-full"
          style={{
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
            onSelectStarter={handleSelectStarter}
          />

          <Ball ball={estado_partido.ball} />
        </svg>

        {/* La pausa cubre únicamente el rectángulo de juego */}
        <div
          className="absolute"
          style={{
            left: "15.625%",
            top: "13.8889%",
            width: "68.75%",
            height: "74.0741%"
          }}
        >
          <MatchPause pausa={pausa} />
        </div>
      </div>

      <ChangeBehaviorMenu
        player={selectedStarter}
        behaviors={behaviors || []}
        isLoading={isLoadingBehaviors}
        isSubmitting={isSubmittingBehavior}
        error={menuError}
        onConfirm={handleConfirmBehaviorChange}
        onCancel={handleCancelBehaviorChange}
      />

      <ExitMatchButton />
    </div>
  )
}
