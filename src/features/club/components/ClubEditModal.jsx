export function ClubEditModal({ title, children, onSave, onCancel, saving, canSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">

      <form onSubmit={(event) => { event.preventDefault(); if (canSave && !saving) onSave(); }}

        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 text-slate-100 flex flex-col gap-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {children}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={saving}
            className="px-4 py-2 rounded-lg bg-slate-700 disabled:opacity-40">Cancelar</button>
          <button type="submit" disabled={saving || !canSave}
            className="px-4 py-2 rounded-lg bg-blue-600 disabled:opacity-40">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        
      </form>

    </div>
  );
}
