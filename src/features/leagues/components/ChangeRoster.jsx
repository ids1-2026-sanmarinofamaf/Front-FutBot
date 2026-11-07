import { useEffect, useState } from "react"
import { getBehaviors } from "../../behaviors/api"
import { getLeagueRoster } from "../api"

export default function ChangeRoster({ leagueId, onClose, onLoadError }) {
  //Hooks para llamados a API
  const [roster, setRoster] = useState(null)
  const [behaviors, setBehaviors] = useState([])
  //Hooks para carga y notificaciones
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Variable para manejar caso de cierre de sesión luego de usar endpoint
    let active = true

    const fetchData = async () => {
      setLoading(true)
      setRoster(null)
      setBehaviors([])

      try {
        // Promise.all permite ejecutar varias operaciones asíncronas en paralelo y esperar a que todas terminen. La alternativa ya usada es secuencial.
        const [rosterData, behaviorsData] = await Promise.all([
          getLeagueRoster(leagueId),
          getBehaviors(),
        ])

        if (!active) return
        setRoster(rosterData)
        setBehaviors(behaviorsData.filter((behavior) => behavior.is_valid === true))
      } catch {
        if (active) {
          onLoadError("Error al cargar la alineación y los comportamientos.")
          onClose()
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchData()
    return () => {
      active = false
    }
  }, [leagueId, showToast, hideToast])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 space-y-4">
        <h2 id="change-roster-title" className="text-2xl font-bold text-slate-100">
          Cambiar alineación
        </h2>
        {loading && <p role="status" className="text-slate-300">Cargando alineación...</p>}
        <button
          type="button"
          onClick={onClose}
          className="px-10 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors shadow-md"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
