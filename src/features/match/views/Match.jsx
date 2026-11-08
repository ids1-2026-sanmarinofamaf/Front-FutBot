
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
import { PenaltyShootout } from "../components/PenaltyShootout.jsx"

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
 * @returns {JSX.Element}
 */
export function Match({
  estado_partido,
  matchId,
  matchInfo,
  pausa,
  ventanaSustitucionesAbierta = true,
  penalties = null,
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

  const playerNumbers = getPlayerNumbers(matchInfo)

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
          />

          <ExitMatchButton />
        </svg>
      </div>

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
