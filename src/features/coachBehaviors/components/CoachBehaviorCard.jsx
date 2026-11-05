/**
 * Tarjeta de presentación de un comportamiento de Director Técnico (DT).
 * Muestra el nombre del DT y las acciones para ver su código o eliminarlo.
 *
 * @param {Object} props
 * @param {{ coach_behavior_id: number, name: string, code?: string }} props.coachBehavior - Datos del comportamiento de DT.
 * @param {(id: number) => void} [props.onView] - Callback invocado al hacer clic en "Ver".
 * @param {(id: number) => void} [props.onDelete] - Callback invocado al hacer clic en "Eliminar".
 * @param {boolean} [props.isDeleting=false] - Indica si el comportamiento se está eliminando actualmente.
 */
export function CoachBehaviorCard({
  coachBehavior,
  onView,
  onDelete,
  isDeleting = false,
}) {
  const handleView = () => {
    if (onView) {
      onView(coachBehavior.coach_behavior_id);
    }
  };

  const handleDelete = () => {
    if (!isDeleting && onDelete) {
      onDelete(coachBehavior.coach_behavior_id);
    }
  };

  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-lg font-medium text-slate-200">
          {coachBehavior.name}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleView}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors"
        >
          Ver
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  );
}

