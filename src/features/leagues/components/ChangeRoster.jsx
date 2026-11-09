import { useEffect, useRef, useState } from "react"
import { getBehaviors } from "../../behaviors/api"
import { getPlayers } from "../../player/api"
import { getCoachBehaviors } from "../../coachBehaviors/api"
import { getLeagueRoster, updateLeagueRoster } from "../api"
import { useToast } from "../../../shared/hooks"
import RightDownAlert from "../../auth/components/RightDownAlert"
import RosterSection from "./RosterSection"
import DiscardRosterChanges from "./DiscardRosterChanges"

export default function ChangeRoster({ leagueId, onClose, onLoadError, onSaveSuccess }) {
  //Hooks para llamados a API
  const [roster, setRoster] = useState(null)
  const [initialRoster, setInitialRoster] = useState(null)
  const [behaviors, setBehaviors] = useState([])
  const [coachBehaviors, setCoachBehaviors] = useState([])
  //Hooks para carga y notificaciones
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDiscardChanges, setShowDiscardChanges] = useState(false)
  const savingRef = useRef(false)
  const { toast, showToast, hideToast } = useToast()
  const [alert, setAlert] = useState("")

  useEffect(() => {
    // Variable para manejar caso de cierre de sesión luego de usar endpoint
    let active = true

    const fetchData = async () => {
      setLoading(true)
      setRoster(null)
      setInitialRoster(null)
      setBehaviors([])
      setCoachBehaviors([])

      try {
        // Promise.all permite ejecutar varias operaciones asíncronas en paralelo y esperar a que todas terminen. La alternativa ya usada es secuencial.
        const [rosterData, behaviorsData, playersData, coachBehaviorsData] = await Promise.all([
          getLeagueRoster(leagueId), //Roster
          getBehaviors(), // Todos los comportamientos creados
          getPlayers(), // Todos los jugadores creados
          getCoachBehaviors(),
        ])

        if (!active) return
        setInitialRoster({
          ...rosterData,
          coach_behavior_id: rosterData.coach_behavior_id ?? null,
          players: rosterData.players.map(player => ({ ...player })),
        })
        // Agrega el nombre y las estadísticas obtenidos de los jugadores del club
        setRoster({
          ...rosterData,
          coach_behavior_id: rosterData.coach_behavior_id ?? null,
          players: rosterData.players.map(player => {
            const clubPlayer = playersData.find(item => item.id === player.player_id)
            return {
              ...player,
              name: clubPlayer?.name ?? "Juancito Chiki Doe",
              power: clubPlayer?.power,
              agility: clubPlayer?.agility,
              control: clubPlayer?.control,
              speed: clubPlayer?.speed,
              strength: clubPlayer?.strength,
            }
          }),
        })
        setBehaviors(behaviorsData)
        setCoachBehaviors(coachBehaviorsData)
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
  }, [leagueId, onLoadError, onClose])

  /**
   * Lógica para modificar la formación ("defensive" u "offensive") de roster
   * @param event: objeto que contiene la formación elegida
   */
  const handleFormationChange = (event) => {
    setRoster(previous => ({ ...previous, formation: event.target.value }))
  }

  const handleCoachBehaviorChange = (event) => {
    const value = event.target.value
    setRoster(previous => ({ ...previous, coach_behavior_id: value === "" ? null : Number(value) }))
  }

  /**
   * Lógica para modificar posición de jugador en roster
   */
  const handleStarterChange = (playerId) => {
    setRoster(previous => {

      const selectedPlayer = previous.players.find(player => player.player_id === playerId)
      const startersCount = previous.players.filter(player => player.is_starter).length

      if (!selectedPlayer || (!selectedPlayer.is_starter && startersCount >= 3)) return previous

      const players = previous.players.map(player =>
        player.player_id === playerId
          ? {
              ...player,
              is_starter: !player.is_starter,
              slot: null,
              initial_behavior_id: player.is_starter
                ? null
                : player.initial_behavior_id,
            }
          : { ...player }
      )

      const availableSlots = ["left", "center", "right"].filter(slot =>
        !players.some(player => player.is_starter && player.slot === slot)
      )

      return {
        ...previous,
        players: players.map(player => ({
          ...player,
          slot: player.is_starter ? player.slot ?? availableSlots.shift() ?? null : null,
        })),
      }
    })
  }

  /**
   * Lógica para modificar comportamiento de jugador en roster
   */
  const handleBehaviorChange = (playerId, behaviorId) => {
    setRoster(previous => ({
      ...previous,
      players: previous.players.map(player =>
        player.player_id === playerId && player.is_starter
          ? {
              ...player,
              initial_behavior_id: behaviorId === ""
                ? null
                : Number(behaviorId)
            }
          : player
      )
    }))
  }
  
  /**
   * Lógica para modificar slot de jugador titular en roster
   */
  const handleSlotChange = (playerId, value) => {
    const slot = value === "" ? null : value

    setRoster(previous => {

      // Guarda para evitar cambio de Slot: Si el slot no es valido el jugador titular ya lo posee
      if (slot !== null && (
        !["left", "center", "right"].includes(slot) ||
        previous.players.some(player => player.player_id !== playerId && player.is_starter && player.slot === slot)))
      {
        return previous
      }

      return {
        ...previous,
        players: previous.players.map(player => player.player_id === playerId && player.is_starter
          ? { ...player, slot }
          : player),
      }
    })
  }

  // Constantes para verificar cantidad de titulares y suplentes
  const startersCount = roster?.players.filter(player => player.is_starter).length ?? 0
  const substitutesCount = roster?.players.filter(player => !player.is_starter).length ?? 0
  const hasValidPlayerCounts = startersCount === 3 && substitutesCount === 3
  
  // Constantes para verificar slots
  const starters = roster?.players.filter(player => player.is_starter) ?? []
  const hasValidSlots = starters.every(player => ["left", "center", "right"].includes(player.slot)) &&
    new Set(starters.map(player => player.slot)).size === 3 &&
    (roster?.players.filter(player => !player.is_starter).every(player => player.slot === null) ?? false)

  // Constante para verificar que todos los jugadores sean distintos
  const hasUniquePlayers = new Set(roster?.players.map(player => player.player_id)).size === 6

  // Constante para verificar las tres condiciones anteriores
  const isValid = hasValidPlayerCounts && hasValidSlots && hasUniquePlayers &&
    ["defensive", "offensive"].includes(roster?.formation)

  // Booleano para indicar si alineacion actual hizo cambios a la original
  const hasChanges = roster !== null && initialRoster !== null && (
    roster.formation !== initialRoster.formation ||
    (roster.coach_behavior_id ?? null) !== (initialRoster.coach_behavior_id ?? null) ||
    roster.players.length !== initialRoster.players.length ||
    roster.players.some(player => {
      const initialPlayer = initialRoster.players.find(item => item.player_id === player.player_id)
      return !initialPlayer ||
        player.is_starter !== initialPlayer.is_starter ||
        player.slot !== initialPlayer.slot ||
        player.initial_behavior_id !== initialPlayer.initial_behavior_id
    })
  )

  const handleClose = () => {
    if (savingRef.current) return
    if (hasChanges) {
      setShowDiscardChanges(true)
      return
    }
    onClose()
  }

  const handleSaveRoster = async () => {
    if (loading || savingRef.current || !isValid || !hasChanges) return

    // Se envían únicamente los campos esperados por el backend
    const payload = {
      formation: roster.formation,
      coach_behavior_id: roster.coach_behavior_id ?? null,
      players: roster.players.map(player => ({
        player_id: player.player_id,
        is_starter: player.is_starter,
        slot: player.slot,
        initial_behavior_id: player.initial_behavior_id,
      }))
    }

    savingRef.current = true
    setSaving(true)
    setAlert("")
    hideToast()

    try {
      await updateLeagueRoster(leagueId, payload)
      setInitialRoster(payload)
      onSaveSuccess()
      onClose()
    } catch (err) {
      //Se maneja multiples codigos centralizadamente, pero solo el primero debería ser visto
      const errorMessages = {
        400: "Todos los jugadores titulares deben tener comportamiento.",
        401: "La sesión no es válida.",
        403: "No participás en esta liga.",
        404: "La liga no existe.",
        409: "La liga no está en curso.",
        422: "Los datos de la petición son inválidos.",
      }
      setAlert(errorMessages[err.status] ?? "Error al actualizar la alineación.")
      showToast()
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 space-y-4">

        <div className="flex items-center justify-between">
          <h2 id="change-roster-title" className="text-2xl font-bold text-slate-100">
            Cambiar alineación
          </h2>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveRoster}
              disabled={loading || saving || showDiscardChanges || !isValid || !hasChanges}
              className="px-10 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors shadow-md disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando alineación..." : "Guardar alineación"}
            </button>

            <button
              type="button"
              onClick={handleClose}
              disabled={saving || showDiscardChanges}
              className="px-10 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors shadow-md"
            >
              Cerrar
            </button>

          </div>
        </div>

        {loading && <p className="text-slate-300">Cargando alineación...</p>}
        {alert && toast && (
          <RightDownAlert 
            key={toast.id} 
            toast={toast} 
            errorTitle="No pudiste guardar la alineación" 
            errorDescription={alert} color="orange" />
        )}

        {!loading && roster && (
          <fieldset disabled={saving || showDiscardChanges} className="space-y-4 text-slate-300">

            <div className="flex flex-wrap items-center justify-between gap-4">

              {/* Formulario de formación */}
              <label className="flex items-center gap-3">
                Formación:
                <select
                  value={roster.formation}
                  onChange={handleFormationChange}
                  className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100"
                >
                  <option value="defensive">defensive</option>
                  <option value="offensive">offensive</option>
                </select>
              </label>

              <label className="flex items-center gap-3">
                Director Técnico (Opcional):
                <select
                  value={roster.coach_behavior_id ?? ""}
                  onChange={handleCoachBehaviorChange}
                  className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100"
                >
                  <option value="">Sin Director Técnico</option>
                  {roster.coach_behavior_id != null && !coachBehaviors.some(cb => cb.coach_behavior_id === roster.coach_behavior_id) && (
                    <option value={roster.coach_behavior_id} disabled>
                      Director Técnico {roster.coach_behavior_id}
                    </option>
                  )}
                  {coachBehaviors.map(cb => (
                    <option key={cb.coach_behavior_id} value={cb.coach_behavior_id}>{cb.name}</option>
                  ))}
                </select>
              </label>

              <p>Titulares: {startersCount}/3 · Suplentes: {substitutesCount}/3</p>
            </div>

            
            {!hasValidPlayerCounts && (
              <p className="text-amber-400">La alineación debe tener exactamente tres titulares y tres suplentes.</p>
            )}

            <div className="space-y-6">

              {/* Titulares */}
              <RosterSection
                title="Titulares"
                players={roster.players.filter(player => player.is_starter)}
                behaviors={behaviors}
                onStarterChange={handleStarterChange}
                onBehaviorChange={handleBehaviorChange}
                onSlotChange={handleSlotChange}
              />

              {/* Suplentes */}
              <RosterSection
                title="Suplentes"
                disablePromotion={startersCount >= 3}
                players={roster.players.filter(player => !player.is_starter)}
                behaviors={behaviors}
                onStarterChange={handleStarterChange}
                onBehaviorChange={handleBehaviorChange}
                onSlotChange={handleSlotChange}
              />

            </div>
          </fieldset>
        )}
      </div>
      {showDiscardChanges && (
        <DiscardRosterChanges
          onCancel={() => setShowDiscardChanges(false)}
          onConfirm={() => {
            setShowDiscardChanges(false)
            onClose()
          }}
        />
      )}
    </div>
  )
}
