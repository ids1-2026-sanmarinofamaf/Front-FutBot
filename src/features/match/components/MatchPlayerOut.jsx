import { useEffect, useRef, useState } from "react"
import { getPlayerById } from "../../player/api.js"

export function MatchPlayerOut({ players, playerNumbers, onSelectStarter }) {
  const [playersInfo, setPlayersInfo] = useState({})
  const requestedIdsRef = useRef(new Set())

  useEffect(function () {
    players.forEach(function (player) {
      const id = player.player_id

      if (playersInfo[id] || requestedIdsRef.current.has(id)) {
        return
      }

      requestedIdsRef.current.add(id)

      getPlayerById(id)
        .then(function (data) {
          setPlayersInfo(function (previous) {
            return { ...previous, [id]: { ...data, isOwn: true } }
          })
        })
        .catch(function () {
          setPlayersInfo(function (previous) {
            return { ...previous, [id]: { name: "Rival", isOwn: false } }
          })
        })
    })
  }, [players, playersInfo])

  return (
    <>
      <StarterColumn
        players={players.filter(function (p) { return p.team === "A" && p.is_on_field })}
        x={40}
        playerNumbers={playerNumbers}
        playersInfo={playersInfo}
        onSelectStarter={onSelectStarter}
      />

      <StarterColumn
        players={players.filter(function (p) { return p.team === "B" && p.is_on_field })}
        x={1790}
        playerNumbers={playerNumbers}
        playersInfo={playersInfo}
        onSelectStarter={onSelectStarter}
      />

      <BenchRow
        players={players.filter(function (p) { return p.team === "A" && !p.is_on_field })}
        startX={320}
        direction={1}
        playersInfo={playersInfo}
      />

      <BenchRow
        players={players.filter(function (p) { return p.team === "B" && !p.is_on_field })}
        startX={1550}
        direction={-1}
        playersInfo={playersInfo}
      />
    </>
  )
}

// Componente para mostrar los jugadores titulares en la cancha
function StarterColumn({ players, x, playerNumbers, playersInfo, onSelectStarter }) {
  return (
    <>
      {players.map(function (player, index) {
        return (
          <PlayerSquare
            key={player.player_id}
            player={player}
            playerInfo={playersInfo[player.player_id]}
            x={x}
            y={150 + index * 100}
            size={90}
            number={playerNumbers[player.player_id]}
            onSelectStarter={onSelectStarter}
          />
        )
      })}
    </>
  )
}

// Componente para mostrar los jugadores suplentes fuera de la cancha
function BenchRow({ players, startX, direction, playersInfo }) {
  return (
    <>
      {players.map(function (player, index) {
        return (
          <PlayerSquareOut
            key={player.player_id}
            player={player}
            playerInfo={playersInfo[player.player_id]}
            x={startX + direction * index * 80}
            y={40}
            size={70}
          />
        )
      })}
    </>
  )
}

// Componente para mostrar un jugador en la cancha
function PlayerSquare({ player, playerInfo, x, y, size, number, onSelectStarter }) {
  const isClickable = Boolean(playerInfo?.isOwn && onSelectStarter)

  function handleClick() {
    if (!isClickable) {
      return
    }
    onSelectStarter({
      player_id: player.player_id,
      name: playerInfo?.name,
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
      <rect x={x} y={y} width={size} height={size} fill={player.team === "A" ? "blue" : "red"} stroke="white" strokeWidth="2" />
      <text x={x + size / 2} y={y + size / 2 - (isClickable ? 16 : 8)} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="14" fontWeight="bold">
        {playerInfo?.name}
      </text>
      <text x={x + size / 2} y={y + size / 2 + (isClickable ? 2 : 12)} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13">
        Number: {number}
      </text>
      {isClickable && (
        <text x={x + size / 2} y={y + size / 2 + 24} textAnchor="middle" dominantBaseline="middle" fill="#bfdbfe" fontSize="11">
          Cambiar comp.
        </text>
      )}
    </g>
  )
}

// Componente para mostrar un jugador fuera de la cancha
function PlayerSquareOut({ player, playerInfo, x, y, size }) {
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} fill={player.team === "A" ? "blue" : "red"} opacity={0.5} stroke="white" strokeWidth="2" />
      <text x={x + size / 2} y={y + size / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13" fontWeight="bold">
        {playerInfo?.name}
      </text>
    </g>
  )
}