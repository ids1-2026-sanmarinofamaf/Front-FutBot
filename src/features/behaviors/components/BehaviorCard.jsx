export function BehaviorCard({ behavior, onView, onEdit, onDelete, isDeleting = false }) {
  const isDefault = Boolean(behavior.is_default);

  const handleView = () => {
    // Ejecuta la función del padre pasando el ID correcto
    if (onView) {
      onView(behavior.behavior_id);
    }
  };

  const handleEdit = () => {
    if (!isDefault && onEdit) {
      onEdit(behavior.behavior_id);
    }
  };

  const handleDelete = () => {
    if (!isDefault && !isDeleting && onDelete) {
      const confirmed = window.confirm("¿Estás seguro de que deseas eliminar este comportamiento?");
      if (confirmed) {
        onDelete(behavior.behavior_id);
      }
    }
  };

  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-lg font-medium text-slate-200">
          {behavior.name}
        </span>
        {isDefault && (
          <span className="text-xs px-2 py-1 rounded font-mono border bg-slate-700/60 text-slate-300 border-slate-600">
            Por defecto
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button 
          onClick={handleView}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors"
        >
          Ver
        </button>
        <button 
          onClick={handleEdit}
          disabled={isDefault}
          title={isDefault ? "Los comportamientos por defecto no se pueden editar" : undefined}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Editar
        </button>
        <button 
          onClick={handleDelete}
          disabled={isDefault || isDeleting}
          title={isDefault ? "Los comportamientos por defecto no se pueden borrar" : undefined}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  );
}
