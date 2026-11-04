export function SubstituteList({
  substitutes,
  playersInfo,
  x,
  y,
  team,
  isSubmitting,
  error,
  onSelect,
  onCancel,
}) {
  const width = 230
  const rowHeight = 44
  const cancelHeight = 40
  const errorHeight = error ? 48 : 0
  const listHeight = Math.max(substitutes.length, 1) * rowHeight
  const height = listHeight + cancelHeight + 15 + errorHeight

  return (
    <g data-testid={`substitute-list-${team}`}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill="#1e293b"
        stroke="white"
        strokeWidth="2"
      />

      {substitutes.length === 0 && (
        <text
          x={x + width / 2}
          y={y + 29}
          textAnchor="middle"
          fill="white"
          fontSize="14"
        >
          Sin suplentes
        </text>
      )}

      {substitutes.map(function (substitute, index) {
        const info = playersInfo[String(substitute.player_id)]
        const name =
          info?.Name ||
          info?.name ||
          "Cargando..."

        const rowY = y + 5 + index * rowHeight

        return (
          <g
            key={substitute.player_id}
            data-testid={`substitute-option-${substitute.player_id}`}
            onClick={function (event) {
              event.stopPropagation()

              if (!isSubmitting) {
                onSelect(substitute)
              }
            }}
            style={{
              cursor: isSubmitting ? "default" : "pointer",
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            <rect
              x={x + 5}
              y={rowY}
              width={width - 10}
              height={39}
              rx={4}
              fill="#334155"
            />

            <text
              x={x + width / 2}
              y={rowY + 25}
              textAnchor="middle"
              fill="white"
              fontSize="15"
            >
              {name}
            </text>
          </g>
        )
      })}

      {isSubmitting && (
        <text
          x={x + width / 2}
          y={y + listHeight + 5}
          textAnchor="middle"
          fill="white"
          fontSize="13"
        >
          Realizando sustitución...
        </text>
      )}

      {error && (
        <text
          x={x + width / 2}
          y={y + listHeight + 5}
          textAnchor="middle"
          fill="#fca5a5"
          fontSize="12"
        >
          {error}
        </text>
      )}

      <g
        data-testid={`cancel-substitution-${team}`}
        onClick={function (event) {
          event.stopPropagation()

          if (!isSubmitting) {
            onCancel()
          }
        }}
        style={{
          cursor: isSubmitting ? "default" : "pointer",
          opacity: isSubmitting ? 0.5 : 1,
        }}
      >
        <rect
          x={x + 5}
          y={y + height - cancelHeight - 5}
          width={width - 10}
          height={34}
          rx={4}
          fill="#991b1b"
        />

        <text
          x={x + width / 2}
          y={y + height - 13}
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
        >
          Cancelar
        </text>
      </g>
    </g>
  )
}

