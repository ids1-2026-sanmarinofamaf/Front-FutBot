export default function ChangeRoster({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 space-y-4">
        <h2 id="change-roster-title" className="text-2xl font-bold text-slate-100">
          Cambiar alineación
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="px-10 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors shadow-md"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
