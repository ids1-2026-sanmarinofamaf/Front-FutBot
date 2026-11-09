import { useNavigate, useLocation } from "react-router-dom"

export function ExitMatchButton({ x = 30, y = 980, width = 220, height = 55 }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleExit = () => {
    //se usa useLocation para detectar el state del navigate de FGCard
    if (location.state?.from === "/friendly") {
      navigate("/friendly", { replace: true })
      return
    }

    navigate(-1)
  }

  return (
    <foreignObject x={x} y={y} width={width} height={height} className="overflow-visible">
      <button
        type="button"
        onClick={handleExit}
        className="w-full h-full px-4 py-2 text-xl font-bold text-white bg-red-700 hover:bg-red-600 border border-red-500 rounded-lg shadow-md transition-colors cursor-pointer flex items-center justify-center"
      >
        Salir del partido
      </button>
    </foreignObject>
  )
}