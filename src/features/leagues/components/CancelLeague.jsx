export default function CancelLeague({ onCancel, onConfirm, cancelling, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl space-y-4">

        <h2 className="text-2xl font-bold text-slate-100">Cancelar liga</h2>

        <p className="text-slate-300">¿Querés cancelar la liga? Los participantes ya no podrán acceder a ella.</p>

        {error && (
          <p className="text-red-400">{error}</p>
        )}

        {cancelling && (
          <div className="flex items-center gap-3 text-slate-300">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-600 border-t-blue-400" />
            <p>Cancelando liga...</p>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            Volver
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={cancelling}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            Confirmar cancelación
          </button>
        </div>

      </div>
    </div>
  );
}
