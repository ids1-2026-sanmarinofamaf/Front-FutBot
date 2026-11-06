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

  function createSquare(x, y, size, color) {
    return <rect x={x} y={y} width={size} height={size} fill={color} />
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
        fill={color}
      />
    )
  }

  return (
    <>
      {createRectangle(14, -4, 12, 4, "LightBlue")}

      {createSquare(toPixels(15, 0).x, toPixels(-1, -1.3).y, 50, "Black")}
      {createSquare(toPixels(23.5, 0).x, toPixels(-1, -1.3).y, 50, "Black")}

      {createText(20, -2.5, "Score", "Black", 60)}

      {current_period ? createText(20, -1.8, `Q${current_period}`, "Black", 22) : null}

      {createText(15.8, -1.5, team1Name, "black", 25)}
      {createText(24.3, -1.5, team2Name, "black", 25)}

      {createText(15.8, -0.3, user1_goals, "White", 40)}
      {createText(24.3, -0.3, user2_goals, "White", 40)}

      {createText(20, -0.3, actual_tic/10 + "/" + total_tic/10 + "sec", "Black", 30)}
      {createText(20, -1, "Time:", "Black", 30)}
    </>
  )
}