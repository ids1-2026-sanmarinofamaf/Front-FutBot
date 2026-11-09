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
  coachSubstitutions = null,
  serverPendingSubstitution = null,
}) {
  const [selectedStarterId, setSelectedStarterId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [substitutionError, setSubstitutionError] = useState(null)
  const [pendingSubstitution, setPendingSubstitution] = useState(null)
  const [substitutionMessage, setSubstitutionMessage] = useState(null)

  const playersInfo = getPlayersInfo(matchInfo)

  // Sincroniza la sustitución pendiente informada por el servidor (por ej. pedida por el DT)
  // para que el botón del titular muestre el nombre del suplente que va a ingresar.
  useEffect(
    function () {
      if (
        !serverPendingSubstitution ||
        serverPendingSubstitution.player_out_id === undefined ||
        serverPendingSubstitution.player_in_id === undefined
      ) {
        return
      }

      const currentPlayersInfo = getPlayersInfo(matchInfo)
      const outgoingInfo =
        currentPlayersInfo[String(serverPendingSubstitution.player_out_id)]
      const incomingInfo =
        currentPlayersInfo[String(serverPendingSubstitution.player_in_id)]

      const outgoingName =
        outgoingInfo?.Name || outgoingInfo?.name || "Jugador"
      const incomingName =
        incomingInfo?.Name || incomingInfo?.name || "Jugador"

      setPendingSubstitution(function (previous) {
        if (
          previous &&
          String(previous.starterId) ===
            String(serverPendingSubstitution.player_out_id) &&
          String(previous.substituteId) ===
            String(serverPendingSubstitution.player_in_id)
        ) {
          return previous
        }

        return {
          starterId: String(serverPendingSubstitution.player_out_id),
          substituteId: String(serverPendingSubstitution.player_in_id),
          outgoingName: outgoingName,
          name: incomingName,
        }
      })
    },
    [serverPendingSubstitution, matchInfo]
  )

  // Muestra el aviso cuando el WebSocket notifica una sustitución ejecutada por el DT propio.
  useEffect(
    function () {
      if (
        !coachSubstitutions?.changes ||
        !Array.isArray(coachSubstitutions.changes)
      ) {
        return
      }

      const ownChange = coachSubstitutions.changes.find(function (change) {
        return (
          matchInfo?.my_club_id !== null &&
          matchInfo?.my_club_id !== undefined &&
          Number(change.club_id) === Number(matchInfo.my_club_id)
        )
      })

      if (!ownChange) return

      const currentPlayersInfo = getPlayersInfo(matchInfo)
      const outgoingInfo = currentPlayersInfo[String(ownChange.player_out_id)]
      const incomingInfo = currentPlayersInfo[String(ownChange.player_in_id)]

      const outgoingName =
        outgoingInfo?.Name || outgoingInfo?.name || "Jugador"
      const incomingName =
        incomingInfo?.Name || incomingInfo?.name || "Jugador"

      setSubstitutionMessage(
        `Sustitución realizada: ${outgoingName} salió y ${incomingName} ingresó.`
      )
      setPendingSubstitution(null)
    },
    [coachSubstitutions, matchInfo]
  )

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

  const selectedStarterX = selectedStarter?.team === "A" ? 30 : 1755
  const selectedStarterY = 160 + selectedStarterIndex * 250

  const menuX =
    selectedStarter?.team === "A"
      ? selectedStarterX + 145
      : selectedStarterX - 260

  const menuY = selectedStarterY + 70

  return (
    <>
      {substitutionMessage && (
        <g data-testid="substitution-message">
          <rect
            x={610}
            y={175}
            width={700}
            height={55}
            rx={10}
            fill="#0f172a"
            fillOpacity="0.82"
            stroke="#5BB5D9"
            strokeWidth="2"
          />

          <text
            x={960}
            y={208}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#F2F2F2"
            fontSize="22"
            fontWeight="bold"
          >
            {substitutionMessage}
          </text>
        </g>
      )}

      <StarterColumn
        players={teamAStarters}
        x={30}
        playerNumbers={playerNumbers}
        playersInfo={playersInfo}
        pendingSubstitution={pendingSubstitution}
        onSelectStarter={onSelectStarter}
        onToggleSubstitutes={handleToggleSubstitutes}
        ventanaSustitucionesAbierta={ventanaSustitucionesAbierta}
      />

      <StarterColumn
        players={teamBStarters}
        x={1755}
        playerNumbers={playerNumbers}
        playersInfo={playersInfo}
        pendingSubstitution={pendingSubstitution}
        onSelectStarter={onSelectStarter}
        onToggleSubstitutes={handleToggleSubstitutes}
        ventanaSustitucionesAbierta={ventanaSustitucionesAbierta}
      />

      <BenchRow
        players={teamASubstitutes}
        startX={310}
        direction={1}
        playersInfo={playersInfo}
      />

      <BenchRow
        players={teamBSubstitutes}
        startX={1525}
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
        const y = 160 + index * 250
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
              size={135}
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
                  x={x + 5}
                  y={y + 142}
                  width={125}
                  height={40}
                  rx={6}
                  fill={isSubDisabled ? "#475569" : "#1e293b"}
                  opacity={isSubDisabled ? 0.6 : 1}
                  stroke={isSubDisabled ? "#94a3b8" : "#F2F2F2"}
                  strokeWidth="1.5"
                />

                <text
                  x={x + 135 / 2}
                  y={y + 167}
                  textAnchor="middle"
                  fill="#F2F2F2"
                  fontSize="18"
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
            x={startX + direction * index * 95}
            y={35}
            size={85}
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
  const isOwn = Boolean(playerInfo?.isOwn)
  const behaviorName = isOwn
    ? (player.current_behavior_name || "Default")
    : null

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
        fill={player.team === "A" ? "#5BB5D9" : "#D98E32"}
        stroke="#F2F2F2"
        strokeWidth="2"
      />

      <text
        x={x + size / 2}
        y={isClickable ? y + 26 : y + 46}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#0f172a"
        fontSize={isClickable ? "24" : "26"}
        fontWeight="bold"
      >
        {playerInfo?.Name || playerInfo?.name}
      </text>

      <text
        x={x + size / 2}
        y={isClickable ? y + 52 : y + 78}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#0f172a"
        fontSize={isClickable ? "22" : "24"}
        fontWeight="bold"
      >
        Number: {number}
      </text>

      {behaviorName && (
        <text
          data-testid={`starter-behavior-${player.player_id}`}
          x={x + size / 2}
          y={y + 77}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#0f172a"
          fontSize="20"
          fontWeight="bold"
        >
          {behaviorName}
        </text>
      )}

      {isClickable && (
        <g>
          <rect
            x={x + 10}
            y={y + 98}
            width={size - 20}
            height={28}
            rx={5}
            fill="#0f172a"
            fillOpacity="0.75"
          />
          <text
            x={x + size / 2}
            y={y + 112}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={player.team === "A" ? "#F2B035" : "#5BB5D9"}
            fontSize="19"
            fontWeight="bold"
          >
            Cambiar comp.
          </text>
        </g>
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
        fill={player.team === "A" ? "#5BB5D9" : "#D98E32"}
        opacity={0.85}
        stroke="#F2F2F2"
        strokeWidth="2"
      />

      <text
        x={x + size / 2}
        y={y + size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#0f172a"
        fontSize={22}
        fontWeight="bold"
      >
        {playerInfo?.Name || playerInfo?.name}
      </text>
    </g>
  )
}