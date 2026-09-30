// views/SoccerField.jsx

export function SoccerField() {
  function toPixels(x, y) {
    return {
      x: 300 + (x / 40) * 1320, // 300: offset x | 40: metros de ancho (FIELD_WIDTH) | 1320: ancho en píxeles
      y: 150 + (y / 20) * 800,   // 150: offset y | 20: metros de alto (FIELD_HEIGHT)  | 820: alto en píxeles
    }
  }

  const netDepth = 40 // profundidad de la red, hacia afuera de la cancha

  const verticalLines = []
  for (let col = 0; col <= 40; col++) {
    const top = toPixels(col, 0)
    const bottom = toPixels(col, 20)
    verticalLines.push(
      <line key={`v-${col}`} x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke="white" strokeWidth="1" opacity="0.5" />
    )
  }

  const horizontalLines = []
  for (let row = 0; row <= 20; row++) {
    const left = toPixels(0, row)
    const right = toPixels(40, row)
    horizontalLines.push(
      <line key={`h-${row}`} x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="white" strokeWidth="1" opacity="0.5" />
    )
  }

  return (
    <>
      {/* patrón de red, reutilizado en ambos arcos */}
      <defs>
        <pattern id="netPattern" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 8 0 L 0 8 M -2 2 L 2 -2 M 6 10 L 10 6" stroke="white" strokeWidth="1.5" opacity="0.9" />
        </pattern>
      </defs>

      {/* césped, extendido para cubrir también el fondo de ambos arcos */}
      <rect x={300 - netDepth} y={150} width={1320 + netDepth * 2} height={800} fill="#2e8b3d" />

      {/* grilla */}
      {verticalLines}
      {horizontalLines}

      {/* línea de medio campo */}
      {(() => {
        const top = toPixels(20, 0)
        const bottom = toPixels(20, 20)
        return <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke="white" strokeWidth="3" />
      })()}

      {/* círculo central */}
      {(() => {
        const center = toPixels(20, 10)
        return <circle cx={center.x} cy={center.y} r="60" fill="none" stroke="white" strokeWidth="3" />
      })()}

      {/* área chica izquierda: 3m de profundidad x 7m de ancho, centrada en el arco (GOAL_WIDTH=3, +2m a cada lado) */}
      {(() => {
        const topLeft = toPixels(0, 6.5)
        const bottomRight = toPixels(3, 13.5)
        return (
          <rect
            x={topLeft.x}
            y={topLeft.y}
            width={bottomRight.x - topLeft.x}
            height={bottomRight.y - topLeft.y}
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
        )
      })()}

      {/* área chica derecha */}
      {(() => {
        const topLeft = toPixels(37, 6.5)
        const bottomRight = toPixels(40, 13.5)
        return (
          <rect
            x={topLeft.x}
            y={topLeft.y}
            width={bottomRight.x - topLeft.x}
            height={bottomRight.y - topLeft.y}
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
        )
      })()}

      {/* borde de la cancha */}
      <rect x={300} y={150} width={1320} height={800} fill="none" stroke="white" strokeWidth="3" />

      {/* red del arco izquierdo */}
      {(() => {
        const top = toPixels(0, 8.5)
        const bottom = toPixels(0, 11.5)
        return (
          <rect
            x={top.x - netDepth}
            y={top.y}
            width={netDepth}
            height={bottom.y - top.y}
            fill="url(#netPattern)"
          />
        )
      })()}

      {/* red del arco derecho */}
      {(() => {
        const top = toPixels(40, 8.5)
        const bottom = toPixels(40, 11.5)
        return (
          <rect
            x={top.x}
            y={top.y}
            width={netDepth}
            height={bottom.y - top.y}
            fill="url(#netPattern)"
          />
        )
      })()}

      {/* arco izquierdo (GOAL_WIDTH = 3m, centrado en y=10) */}
      {(() => {
        const top = toPixels(0, 8.5)
        const bottom = toPixels(0, 11.5)
        return <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke="white" strokeWidth="6" />
      })()}

      {/* arco derecho */}
      {(() => {
        const top = toPixels(40, 8.5)
        const bottom = toPixels(40, 11.5)
        return <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke="white" strokeWidth="6" />
      })()}
    </>
  )
}