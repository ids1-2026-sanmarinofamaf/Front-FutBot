export default function LeagueCancelled({ onBack }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl space-y-4">

        <h2 className="text-2xl font-bold text-slate-100">Liga cancelada</h2>

        <p className="text-slate-300">El creador canceló la liga. Ya no podés acceder a este lobby.</p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors"
          >
            Volver al listado de ligas
          </button>
        </div>

      </div>
    </div>
  );
}
