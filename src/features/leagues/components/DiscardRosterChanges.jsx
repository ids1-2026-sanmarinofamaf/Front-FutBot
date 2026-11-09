export default function DiscardRosterChanges({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl space-y-4">
        <h2 className="text-2xl font-bold text-slate-100">Descartar cambios</h2>
        <p className="text-slate-300">Tenés cambios sin guardar. ¿Querés descartarlos y cerrar?</p>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors shadow-md"
          >
            Seguir editando
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-md"
          >
            Descartar y cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
