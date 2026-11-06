import { useEffect, useState } from "react"
import { makeSubstitution } from "../api.js"
import { SubstituteList } from "./SubstituteList.jsx"

const SUBSTITUTION_MESSAGE_DURATION = 4000

/**
 * Construye la información de cada jugador a partir de `matchInfo`.
 * Determina si el jugador pertenece al club del usuario mediante `matchInfo.my_club_id`.
 *
 * @param {Object} matchInfo - Información estática del partido.
 * @returns {Object} Mapa de información de jugadores por player_id.
 */
function getPlayersInfo(matchInfo) {
  const info = {}

  if (!matchInfo?.players) {
    return info
  }

  matchInfo.players.forEach(function (player) {
    const isOwn = Boolean(
      matchInfo.my_club_id !== null &&
      matchInfo.my_club_id !== undefined &&
      player.club_id === matchInfo.my_club_id
    )

    info[String(player.player_id)] = {
      player_id: player.player_id,
      name: player.name,
      Name: player.name,
      shirt_number: player.shirt_number,
      club_id: player.club_id,
      team: player.team,
      isOwn: isOwn,
    }
  })

  return info
}

/**
 * Componente que renderiza los jugadores fuera del campo de juego (titulares en los laterales
 * y suplentes en el banco), permitiendo solicitar sustituciones entre ellos.
 *
 * @param {Object} props
 * @param {Array<Object>} props.players - Jugadores en el estado dinámico del partido.
 * @param {Object} props.playerNumbers - Mapeo de player_id a número de dorsal.
 * @param {string|number} [props.matchId] - ID del partido.
 * @param {Object} props.matchInfo - Información estática recibida por WebSocket.
 * @param {Function} [props.onSelectStarter] - Callback al hacer click en un titular propio.
 * @param {boolean} [props.ventanaSustitucionesAbierta=true] - Si la ventana de sustituciones está abierta.
 * @returns {JSX.Element}
 */
export function MatchPlayerOut({
  players,
  playerNumbers,
  matchId,
  matchInfo,
  onSelectStarter,
  ventanaSustitucionesAbierta = true,
}) {
  const [selectedStarterId, setSelectedStarterId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [substitutionError, setSubstitutionError] = useState(null)
  const [pendingSubstitution, setPendingSubstitution] = useState(null)
  const [substitutionMessage, setSubstitutionMessage] = useState(null)

  const playersInfo = getPlayersInfo(matchInfo)

  // Confirma la sustitución únicamente cuando el WebSocket
  // informa que el titular salió y el suplente ingresó.
  useEffect(function () {
    if (!pendingSubstitution) return

    const outgoingPlayer = players.find(function (player) {
      return (
        String(player.player_id) ===
        String(pendingSubstitution.starterId)
      )
    })

    const incomingPlayer = players.find(function (player) {
      return (
        String(player.player_id) ===
        String(pendingSubstitution.substituteId)
      )
    })

    if (
      outgoingPlayer &&
      incomingPlayer &&
      !outgoingPlayer.is_on_field &&
      incomingPlayer.is_on_field
    ) {
      setSubstitutionMessage(
        `Sustitución realizada: ${pendingSubstitution.outgoingName} salió y ${pendingSubstitution.name} ingresó.`
      )

      setPendingSubstitution(null)
    }
  }, [players, pendingSubstitution])

  useEffect(function () {
    if (!substitutionMessage) return

    const timeout = setTimeout(function () {
      setSubstitutionMessage(null)
    }, SUBSTITUTION_MESSAGE_DURATION)

    return function () {
      clearTimeout(timeout)
    }
  }, [substitutionMessage])

  function handleToggleSubstitutes(player) {
    if (isSubmitting) return

    setSubstitutionError(null)

    setSelectedStarterId(function (previous) {
      return String(previous) === String(player.player_id)
        ? null
        : player.player_id
    })
  }

  async function handleSelectSubstitute(starter, substitute) {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      setSubstitutionError(null)

      await makeSubstitution(
        matchId,
        starter.player_id,
        substitute.player_id
      )

      const substituteInfo = playersInfo[String(substitute.player_id)]
      const starterInfo = playersInfo[String(starter.player_id)]

      const substituteName =
        substituteInfo?.Name ||
        substituteInfo?.name ||
        "Jugador"

      const starterName =
        starterInfo?.Name ||
        starterInfo?.name ||
        "Jugador"

      setPendingSubstitution({
        starterId: String(starter.player_id),
        substituteId: String(substitute.player_id),
        outgoingName: starterName,
        name: substituteName,
      })

      // El mensaje anterior deja de mostrarse al programar
      // una nueva sustitución.
      setSubstitutionMessage(null)
      setSelectedStarterId(null)
    } catch (error) {
      const status =
        error.status ||
        error.statusCode ||
        error.response?.status

      if (status === 401 || status === 403) {
        setSubstitutionError(
          "No estás autorizado para realizar esta sustitución."
        )
      } else if (status === 404) {
        setSubstitutionError(
          "No se encontró el partido o alguno de los jugadores."
        )
      } else if (status === 409) {
        setSubstitutionError(
          "Se alcanzó el límite de sustituciones."
        )
      } else {
        setSubstitutionError(
          error.message || "No se pudo realizar la sustitución."
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancelSubstitution() {
    if (isSubmitting) return

    setSelectedStarterId(null)
    setSubstitutionError(null)
  }

  const teamAStarters = players.filter(function (player) {
    return player.team === "A" && player.is_on_field
  })

  const teamBStarters = players.filter(function (player) {
    return player.team === "B" && player.is_on_field
  })

  const teamASubstitutes = players.filter(function (player) {
    return player.team === "A" && !player.is_on_field
  })

  const teamBSubstitutes = players.filter(function (player) {
    return player.team === "B" && !player.is_on_field
  })

  const selectedStarter = players.find(function (player) {
    return String(player.player_id) === String(selectedStarterId)
  })

  const selectedSubstitutesList = selectedStarter
    ? selectedStarter.team === "A"
      ? teamASubstitutes
      : teamBSubstitutes
    : []

  const selectedStarterIndex = selectedStarter
    ? selectedStarter.team === "A"
      ? teamAStarters.findIndex(function (player) {
          return String(player.player_id) === String(selectedStarterId)
        })
      : teamBStarters.findIndex(function (player) {
          return String(player.player_id) === String(selectedStarterId)
        })
    : -1

  const selectedStarterX = selectedStarter?.team === "A" ? 40 : 1790
  const selectedStarterY = 150 + selectedStarterIndex * 100

  const menuX =
    selectedStarter?.team === "A"
      ? selectedStarterX + 100
      : selectedStarterX - 240

  const menuY = selectedStarterY + 65

  return (
    <>
      {substitutionMessage && (
        <g data-testid="substitution-message">
          <rect
            x={610}
            y={35}
            width={700}
            height={55}
            rx={8}
            fill="#166534"
            stroke="white"
            strokeWidth="2"
          />

          <text
            x={960}
            y={68}
            textAnchor="middle"
            fill="white"
            fontSize="20"
            fontWeight="bold"
          >
            {substitutionMessage}
          </text>
        </g>
      )}

      <StarterColumn
        players={teamAStarters}
        x={40}
        playerNumbers={playerNumbers}
        playersInfo={playersInfo}
        pendingSubstitution={pendingSubstitution}
        onSelectStarter={onSelectStarter}
        onToggleSubstitutes={handleToggleSubstitutes}
        ventanaSustitucionesAbierta={ventanaSustitucionesAbierta}
      />

      <StarterColumn
        players={teamBStarters}
        x={1790}
        playerNumbers={playerNumbers}
        playersInfo={playersInfo}
        pendingSubstitution={pendingSubstitution}
        onSelectStarter={onSelectStarter}
        onToggleSubstitutes={handleToggleSubstitutes}
        ventanaSustitucionesAbierta={ventanaSustitucionesAbierta}
      />

      <BenchRow
        players={teamASubstitutes}
        startX={320}
        direction={1}
        playersInfo={playersInfo}
      />

      <BenchRow
        players={teamBSubstitutes}
        startX={1550}
        direction={-1}
        playersInfo={playersInfo}
      />

      {selectedStarter && (
        <SubstituteList
          substitutes={selectedSubstitutesList}
          playersInfo={playersInfo}
          x={menuX}
          y={menuY}
          team={selectedStarter.team}
          isSubmitting={isSubmitting}
          error={substitutionError}
          onSelect={function (substitute) {
            handleSelectSubstitute(selectedStarter, substitute)
          }}
          onCancel={handleCancelSubstitution}
        />
      )}
    </>
  )
}

function StarterColumn({
  players,
  x,
  playerNumbers,
  playersInfo,
  pendingSubstitution,
  onSelectStarter,
  onToggleSubstitutes,
  ventanaSustitucionesAbierta = true,
}) {
  return (
    <>
      {players.map(function (player, index) {
        const y = 150 + index * 100
        const playerInfo = playersInfo[String(player.player_id)]
        const isOwn = Boolean(playerInfo?.isOwn)
        const isSubDisabled = !ventanaSustitucionesAbierta

        const buttonLabel =
          pendingSubstitution &&
          String(pendingSubstitution.starterId) ===
            String(player.player_id)
            ? pendingSubstitution.name
            : "Cambiar jugador"

        return (
          <g key={player.player_id}>
            <PlayerSquare
              player={player}
              playerInfo={playerInfo}
              x={x}
              y={y}
              size={90}
              number={playerNumbers[player.player_id]}
              onSelectStarter={onSelectStarter}
            />

            {isOwn && (
              <g
                data-testid={`substitution-button-${player.player_id}`}
                aria-disabled={isSubDisabled}
                onClick={function (event) {
                  event.stopPropagation()
                  if (isSubDisabled) return
                  onToggleSubstitutes(player)
                }}
                style={{ cursor: isSubDisabled ? "not-allowed" : "pointer" }}
              >
                <rect
                  x={player.team === "A" ? x + 95 : x - 115}
                  y={y + 30}
                  width={110}
                  height={34}
                  rx={5}
                  fill={isSubDisabled ? "#475569" : "#166534"}
                  opacity={isSubDisabled ? 0.6 : 1}
                  stroke={isSubDisabled ? "#94a3b8" : "white"}
                  strokeWidth="1.5"
                />

                <text
                  x={player.team === "A" ? x + 150 : x - 60}
                  y={y + 52}
                  textAnchor="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight="bold"
                >
                  {buttonLabel}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </>
  )
}

function BenchRow({ players, startX, direction, playersInfo }) {
  return (
    <>
      {players.map(function (player, index) {
        return (
          <PlayerSquareOut
            key={player.player_id}
            player={player}
            playerInfo={playersInfo[String(player.player_id)]}
            x={startX + direction * index * 80}
            y={40}
            size={70}
          />
        )
      })}
    </>
  )
}

function PlayerSquare({
  player,
  playerInfo,
  x,
  y,
  size,
  number,
  onSelectStarter,
}) {
  const isClickable = Boolean(playerInfo?.isOwn && onSelectStarter)
  const behaviorName = player.current_behavior_name || "Default"

  function handleClick() {
    if (!isClickable) return

    onSelectStarter({
      player_id: player.player_id,
      name: playerInfo?.Name || playerInfo?.name,
      number,
      team: player.team,
    })
  }

  return (
    <g
      data-testid={`starter-card-${player.player_id}`}
      onClick={isClickable ? handleClick : undefined}
      style={isClickable ? { cursor: "pointer" } : undefined}
    >
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={player.team === "A" ? "blue" : "red"}
        stroke="white"
        strokeWidth="2"
      />

      <text
        x={x + size / 2}
        y={isClickable ? y + 20 : y + 26}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={isClickable ? "13" : "14"}
        fontWeight="bold"
      >
        {playerInfo?.Name || playerInfo?.name}
      </text>

      <text
        x={x + size / 2}
        y={isClickable ? y + 37 : y + 46}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={isClickable ? "12" : "13"}
      >
        Number: {number}
      </text>

      <text
        data-testid={`starter-behavior-${player.player_id}`}
        x={x + size / 2}
        y={isClickable ? y + 54 : y + 66}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#e2e8f0"
        fontSize={isClickable ? "11" : "12"}
      >
        {behaviorName}
      </text>

      {isClickable && (
        <text
          x={x + size / 2}
          y={y + 72}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#bfdbfe"
          fontSize="10"
        >
          Cambiar comp.
        </text>
      )}
    </g>
  )
}

function PlayerSquareOut({ player, playerInfo, x, y, size }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={player.team === "A" ? "blue" : "red"}
        opacity={0.5}
        stroke="white"
        strokeWidth="2"
      />

      <text
        x={x + size / 2}
        y={y + size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="13"
        fontWeight="bold"
      >
        {playerInfo?.Name || playerInfo?.name}
      </text>
    </g>
  )
}