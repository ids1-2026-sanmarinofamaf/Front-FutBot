export function BehaviorCard({ behavior, onView }) {
  // Si el backend no informa el estado, se considera válido por defecto.
  const isValid = behavior.is_valid !== false;

  const handleView = () => {
    // Ejecuta la función del padre pasando el ID correcto
    if (onView) {
      onView(behavior.behavior_id);
    }
  };

  const handleEdit = () => {
    console.info('Endpoint de edición no implementado.');
  };

  const handleDelete = () => {
    console.info('Endpoint de borrado no implementado.');
  };

  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-lg font-medium text-slate-200">
          {behavior.name}
        </span>
        <span 
          className={`text-xs px-2 py-1 rounded font-mono border ${
            isValid
              ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800' 
              : 'bg-red-900/40 text-red-400 border-red-800'
          }`}
        >
          {isValid ? 'Válido' : 'Inválido'}
        </span>
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
          className="px-3 py-1.5 bg-slate-700 text-slate-400 text-sm font-medium rounded cursor-not-allowed opacity-70"
          title="No disponible en este sprint"
        >
          Editar
        </button>
        <button 
          onClick={handleDelete}
          className="px-3 py-1.5 bg-slate-700 text-slate-400 text-sm font-medium rounded cursor-not-allowed opacity-70"
          title="No disponible en este sprint"
        >
          Borrar
        </button>
      </div>
    </div>
  );
}
