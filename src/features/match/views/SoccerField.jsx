// views/SoccerField.jsx

export function SoccerField() {
  function toPixels(x, y) {
    return {
      x: 300 + (x / 40) * 1320, // 300: offset x | 40: metros de ancho (FIELD_WIDTH) | 1320: ancho en píxeles
      y: 150 + (y / 20) * 800,   // 150: offset y | 20: metros de alto (FIELD_HEIGHT)  | 800: alto en píxeles
    }
  }

  const netDepth = 40 // profundidad de la red, hacia afuera de la cancha

  return (
    <>
      {/* patrón de red, reutilizado en ambos arcos */}
      <defs>
        <pattern
          id="netPattern"
          width={14}
          height={14}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 0 0 L 14 14 M 14 0 L 0 14"
            fill="none"
            stroke="white"
            strokeWidth={1}
          />
        </pattern>
        <pattern
          id="pitch-stripes"
          x={300}
          y={150}
          width={528}
          height={800}
          patternUnits="userSpaceOnUse"
        >
          <rect
            width={264}
            height={800}
            fill="#5F8256"
          />
        </pattern>
      </defs>

      {/* césped, extendido para cubrir también el fondo de ambos arcos */}
      <rect x={300 - netDepth} y={150} width={1320 + netDepth * 2} height={800} fill="#678C5D" />

      {/* Alternating mowing stripes, below the pitch markings. */}
      <rect
        x={300}
        y={150}
        width={1320}
        height={800}
        fill="url(#pitch-stripes)"
      />

      {/* línea de medio campo */}
      {(() => {
        const top = toPixels(20, 0)
        const bottom = toPixels(20, 20)
        return <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke="white" strokeWidth="4" />
      })()}

      {/* círculo central */}
      {(() => {
        const center = toPixels(20, 10)
        return <circle cx={center.x} cy={center.y} r="150" fill="none" stroke="white" strokeWidth="4" />
      })()}

      {/* área chica izquierda: 6m de profundidad x 11m de ancho, centrada en el arco  */}
      {(() => {
        const topLeft = toPixels(0, 4.5)
        const bottomRight = toPixels(6, 15.5)
        return (
          <rect
            x={topLeft.x}
            y={topLeft.y}
            width={bottomRight.x - topLeft.x}
            height={bottomRight.y - topLeft.y}
            fill="none"
            stroke="white"
            strokeWidth="4"
          />
        )
      })()}

      {/* área chica derecha */}
      {(() => {
        const topLeft = toPixels(34, 4.5)
        const bottomRight = toPixels(40, 15.5)
        return (
          <rect
            x={topLeft.x}
            y={topLeft.y}
            width={bottomRight.x - topLeft.x}
            height={bottomRight.y - topLeft.y}
            fill="none"
            stroke="white"
            strokeWidth="4"
          />
        )
      })()}

      {/* borde de la cancha */}
      <rect x={300} y={150} width={1320} height={800} fill="none" stroke="white" strokeWidth="4" />

      {/* Mirrored goals: shadow, translucent net, frame and front posts. */}
      {[0, 40].map(function (goalX) {
        const top = toPixels(goalX, 8.5)
        const bottom = toPixels(goalX, 11.5)
        const direction = goalX === 0 ? -1 : 1
        const backX = top.x + direction * netDepth

        const goalShape = `
          M ${top.x} ${top.y}
          L ${backX} ${top.y + 8}
          L ${backX} ${bottom.y - 8}
          L ${bottom.x} ${bottom.y}
          Z
        `

        return (
          <g key={goalX}>
            <path
              d={goalShape}
              transform="translate(0 5)"
              fill="#0F172A"
              opacity={0.18}
            />

            <path
              d={goalShape}
              fill="url(#netPattern)"
              fillOpacity={0.4}
              stroke="white"
              strokeOpacity={0.65}
              strokeWidth={3}
              strokeLinejoin="round"
            />

            <line
              x1={top.x}
              y1={top.y}
              x2={bottom.x}
              y2={bottom.y}
              stroke="white"
              strokeWidth={8}
              strokeLinecap="round"
            />

            <circle cx={top.x} cy={top.y} r={5} fill="white" />
            <circle cx={bottom.x} cy={bottom.y} r={5} fill="white" />
          </g>
        )
      })}
    </>
  )
}