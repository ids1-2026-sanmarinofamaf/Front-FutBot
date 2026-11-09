/**
 * Componente de marcador del partido (Scoreboard).
 * Renderiza en SVG los nombres reales de los clubes, los goles, el tiempo y el período actual.
 *
 * @param {Object} props
 * @param {Object} props.estado_partido - Estado dinámico del partido (goles, tics, current_period).
 * @param {Object|null} [props.matchInfo] - Información estática con nombres de clubes y metadatos.
 * @returns {JSX.Element}
 */
export function Scoreboard({ estado_partido, matchInfo = null }) {
  const user1_goals = estado_partido.user1_goals
  const user2_goals = estado_partido.user2_goals
  const actual_tic = estado_partido.actual_tic
  const total_tic = estado_partido.total_tic
  const current_period = estado_partido.current_period

  const team1Name = matchInfo?.team_a?.club_name || "team 1"
  const team2Name = matchInfo?.team_b?.club_name || "team 2"

  function toPixels(x, y) {
    return {
      x: 300 + (x / 40) * 1320,
      y: 150 + (y / 20) * 800,
    }
  }

  function createText(x, y, text, color, size) {
    const pos = toPixels(x, y)

    return (
      <text
        x={pos.x}
        y={pos.y}
        fill={color}
        fontSize={size}
        fontWeight="bold"
        textAnchor="middle"
      >
        {text}
      </text>
    )
  }

  function createSquare(x, y, size, color, strokeColor = null) {
    return (
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        rx={6}
        fill={color}
        stroke={strokeColor || "none"}
        strokeWidth={strokeColor ? "2" : "0"}
      />
    )
  }

  function createRectangle(x, y, width, height, color) {
    const topLeft = toPixels(x, y)
    const bottomRight = toPixels(x + width, y + height)

    return (
      <rect
        x={topLeft.x}
        y={topLeft.y}
        width={bottomRight.x - topLeft.x}
        height={bottomRight.y - topLeft.y}
        rx={8}
        fill={color}
        stroke="#475569"
        strokeWidth="1.5"
      />
    )
  }

  return (
    <>
      {createRectangle(14, -4, 12, 4, "#1e293b")}

      {createSquare(toPixels(15, 0).x, toPixels(-1, -1.3).y, 50, "Black", "#5BB5D9")}
      {createSquare(toPixels(23.5, 0).x, toPixels(-1, -1.3).y, 50, "Black", "#D98E32")}

      {createText(20, -2.5, "Score", "#F2F2F2", 60)}

      {current_period ? createText(20, -1.8, `Q${current_period}`, "#F2B035", 22) : null}

      {createText(15.8, -1.5, team1Name, "#5BB5D9", 25)}
      {createText(24.3, -1.5, team2Name, "#D98E32", 25)}

      {createText(15.8, -0.3, user1_goals, "#F2F2F2", 40)}
      {createText(24.3, -0.3, user2_goals, "#F2F2F2", 40)}

      {createText(20, -0.3, actual_tic/10 + "/" + total_tic/10 + "sec", "#F2F2F2", 30)}
      {createText(20, -1, "Time:", "#F2F2F2", 30)}
    </>
  )
}