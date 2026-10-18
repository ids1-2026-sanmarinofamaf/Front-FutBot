import { useNavigate, useLocation } from "react-router-dom"

export function ExitMatchButton() {
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
    <button
      type="button"
      onClick={handleExit}
      className="absolute bottom-35 left-4 px-4 py-2 text-xl text-white bg-red-600 border border-red-600 rounded"
    >
      Salir del partido
    </button>
  )
}