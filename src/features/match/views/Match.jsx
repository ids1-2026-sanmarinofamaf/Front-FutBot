
function toPixels(x, y) {
  return {
    //Acá calculo las posibles posiciones de los jugadores y la pelota en la cancha, para que se vean bien en la pantalla.
    x: 300 + (x / 40) * 1320, // (Desplazamiento de la cancha) + (posicion del ente en la cancha / ancho de la cancha) * ancho de la cancha en pixeles
    y: 150 + (y / 20) * 820, 
  }
}

export function Match() {
  return (
    <svg viewBox="0 0 1920 1080" style={{ width: "100%", maxWidth: 1920, height: "auto", backgroundColor: "#063343" }}>
       <image href="/cancha.png" x="300" y="150" width="1320" height="820" preserveAspectRatio="xMidYMid meet" />
    </svg>
  )
}