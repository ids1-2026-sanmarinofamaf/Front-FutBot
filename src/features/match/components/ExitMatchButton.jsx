import { useNavigate } from "react-router-dom"

export function ExitMatchButton() {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="absolute bottom-35 left-4 px-4 py-2 text-xl text-white bg-red-600 border border-red-600 rounded"
    >
      Salir del partido
    </button>
  )
}