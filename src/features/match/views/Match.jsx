
import { useEffect, useState } from "react"
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
import { PenaltyShootout } from "../components/PenaltyShootout.jsx"

const COACH_MESSAGE_DURATION = 4000

/**
 * Obtiene el mapa de dorsales fijos (shirt_number) para cada jugador a partir de `matchInfo`.
 *
 * @param {Object} matchInfo - Información estática del partido.
 * @returns {Object} Mapeo { [player_id]: shirt_number }.
 */
function getPlayerNumbers(matchInfo) {
  const numbers = {}

  if (matchInfo?.players) {
    matchInfo.players.forEach(function (player) {
      numbers[player.player_id] = player.shirt_number
    })
  }

  return numbers
}

/**
 * Componente de vista para el partido en juego.
 * Renderiza la cancha, jugadores, pelota, marcador y paneles laterales.
 *
 * @param {Object} props
 * @param {Object} props.estado_partido - Estado dinámico animado del partido.
 * @param {string|number} [props.matchId] - Identificador del partido.
 * @param {Object} props.matchInfo - Metadatos iniciales del partido (clubes, dorsales, DT).
 * @param {Object|null} [props.pausa] - Datos de pausa activa si el partido está pausado.
 * @param {boolean} [props.ventanaSustitucionesAbierta=true] - Si la ventana para realizar sustituciones está abierta.
 * @param {Object|null} [props.penalties=null] - Shootout phase, event data and result history.
 * @returns {JSX.Element}
 */
export function Match({
  estado_partido,
  matchId,
  matchInfo,
  pausa,
  ventanaSustitucionesAbierta = true,
  penalties = null,
  coachChanges = null,
  coachSubstitutions = null,
}) {
  const params = useParams()
  const effectiveMatchId = matchId ?? params?.matchId

  const [selectedStarter, setSelectedStarter] = useState(null)
  const [behaviors, setBehaviors] = useState(null)
  const [isLoadingBehaviors, setIsLoadingBehaviors] = useState(false)
  const [isSubmittingBehavior, setIsSubmittingBehavior] = useState(false)
  const [menuError, setMenuError] = useState(null)
  const [assignedBehaviorsByPlayer, setAssignedBehaviorsByPlayer] = useState({})
  const [assignedBehaviorNames, setAssignedBehaviorNames] = useState({})
  const [coachMessage, setCoachMessage] = useState(null)

  const playerNumbers = getPlayerNumbers(matchInfo)

  // Cuando llega coachChanges desde el WebSocket, sincronizamos/limpiamos
  // los overrides manuales de esos jugadores y mostramos el cartel temporal.
  useEffect(
    function () {
      if (!coachChanges?.changes || !Array.isArray(coachChanges.changes)) {
        return
      }

      const ownChanges = coachChanges.changes.filter(function (change) {
        if (
          matchInfo?.my_club_id !== null &&
          matchInfo?.my_club_id !== undefined &&
          change.club_id !== undefined
        ) {
          return Number(change.club_id) === Number(matchInfo.my_club_id)
        }
        return true
      })

      if (ownChanges.length === 0) {
        return
      }

      setAssignedBehaviorNames(function (previous) {
        const next = { ...previous }
        ownChanges.forEach(function (change) {
          delete next[change.player_id]
        })
        return next
      })

      setAssignedBehaviorsByPlayer(function (previous) {
        const next = { ...previous }
        ownChanges.forEach(function (change) {
          delete next[change.player_id]
        })
        return next
      })

      const descriptions = ownChanges.map(function (change) {
        const playerMeta = matchInfo?.players?.find(function (p) {
          return String(p.player_id) === String(change.player_id)
        })
        const playerName = playerMeta?.name || `#${change.player_id}`
        const behaviorName = change.behavior ?? change.behavior_name ?? "Default"
        return `${playerName} → ${behaviorName}`
      })

      setCoachMessage(`DT asignó: ${descriptions.join(", ")}`)
    },
    [coachChanges, matchInfo]
  )

  useEffect(
    function () {
      if (!coachMessage) return

      const timeout = setTimeout(function () {
        setCoachMessage(null)
      }, COACH_MESSAGE_DURATION)

      return function () {
        clearTimeout(timeout)
      }
    },
    [coachMessage]
  )

  useEffect(
    function () {
      if (!estado_partido?.players) return

      setAssignedBehaviorNames(function (previous) {
        const keys = Object.keys(previous)
        if (keys.length === 0) return previous
        let changed = false
        const next = { ...previous }
        estado_partido.players.forEach(function (player) {
          if (
            next[player.player_id] &&
            player.current_behavior_name === next[player.player_id]
          ) {
            delete next[player.player_id]
            changed = true
          }
        })
        return changed ? next : previous
      })
    },
    [estado_partido?.players]
  )

  async function handleSelectStarter(starter) {
    setMenuError(null)
    const playerInState = estado_partido?.players?.find(function (p) {
      return String(p.player_id) === String(starter.player_id)
    })
    setSelectedStarter({
      ...starter,
      currentBehaviorId:
        assignedBehaviorsByPlayer[starter.player_id] ??
        playerInState?.current_behavior_id ??
        null,
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

      const chosenBehavior = behaviors?.find(function (b) {
        return Number(b.behavior_id) === Number(behaviorId)
      })

      setAssignedBehaviorsByPlayer(function (previous) {
        return {
          ...previous,
          [selectedStarter.player_id]: behaviorId,
        }
      })

      if (chosenBehavior?.name) {
        setAssignedBehaviorNames(function (previous) {
          return {
            ...previous,
            [selectedStarter.player_id]: chosenBehavior.name,
          }
        })
      }

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
          {/* Replace only the pitch; the scoreboard, side panels and exit remain visible. */}
          {penalties ? (
            <foreignObject
              x={300}
              y={150}
              width={1320}
              height={800}
            >
              <PenaltyShootout
                matchInfo={matchInfo}
                penalties={penalties}
              />
            </foreignObject>
          ) : (
            <>
              <SoccerField />

              <MatchPlayerInMatch
                players={estado_partido.players}
                playerNumbers={playerNumbers}
              />

              <Ball ball={estado_partido.ball} />

              <foreignObject
                x={300}
                y={150}
                width={1320}
                height={800}
                className="pointer-events-none"
              >
                <MatchPause pausa={pausa} />
              </foreignObject>
            </>
          )}

          <Scoreboard
            estado_partido={estado_partido}
            matchInfo={matchInfo}
          />

          {/* Insignia DT Equipo A */}
          <g data-testid="coach-badge-A">
            <rect
              x={30}
              y={90}
              width={230}
              height={44}
              rx={8}
              fill="#1e293b"
              stroke="#5BB5D9"
              strokeWidth="2"
              opacity="0.95"
            />
            <text
              x={145}
              y={117}
              textAnchor="middle"
              fill="#F2F2F2"
              fontSize="18"
              fontWeight="bold"
            >
              {`DT: ${matchInfo?.team_a?.coach_behavior_name || "Sin DT"}`}
            </text>
          </g>

          {/* Insignia DT Equipo B */}
          <g data-testid="coach-badge-B">
            <rect
              x={1660}
              y={90}
              width={230}
              height={44}
              rx={8}
              fill="#1e293b"
              stroke="#D98E32"
              strokeWidth="2"
              opacity="0.95"
            />
            <text
              x={1775}
              y={117}
              textAnchor="middle"
              fill="#F2F2F2"
              fontSize="18"
              fontWeight="bold"
            >
              {`DT: ${matchInfo?.team_b?.coach_behavior_name || "Sin DT"}`}
            </text>
          </g>

          {/* Keep the player cards visible while locking manual changes during the shootout. */}
          <MatchPlayerOut
            players={estado_partido.players.map(function (player) {
              const assignedName = assignedBehaviorNames[player.player_id]
              return assignedName
                ? { ...player, current_behavior_name: assignedName }
                : player
            })}
            playerNumbers={playerNumbers}
            matchId={effectiveMatchId}
            matchInfo={matchInfo}
            onSelectStarter={handleSelectStarter}
            behaviorChangesDisabled={Boolean(penalties)}
            ventanaSustitucionesAbierta={
              ventanaSustitucionesAbierta && !penalties
            }
            coachSubstitutions={coachSubstitutions}
            serverPendingSubstitution={estado_partido.pending_substitution}
          />

          {coachMessage && (
            <g data-testid="coach-changes-message">
              <rect
                x={550}
                y={240}
                width={820}
                height={55}
                rx={10}
                fill="#0f172a"
                fillOpacity="0.82"
                stroke="#5BB5D9"
                strokeWidth="2"
              />
              <text
                x={960}
                y={273}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#F2F2F2"
                fontSize="22"
                fontWeight="bold"
              >
                {coachMessage}
              </text>
            </g>
          )}

          <ExitMatchButton />
        </svg>
      </div>

      {/* Hide a behavior menu that was already open when the shootout began. */}
      <ChangeBehaviorMenu
        player={penalties ? null : selectedStarter}
        behaviors={behaviors || []}
        isLoading={isLoadingBehaviors}
        isSubmitting={isSubmittingBehavior}
        error={menuError}
        onConfirm={handleConfirmBehaviorChange}
        onCancel={handleCancelBehaviorChange}
      />
    </div>
  )
}
