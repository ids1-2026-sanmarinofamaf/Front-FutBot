/**
 * Presentational component displaying a player's summary.
 * Renders PACCS attributes with dynamic color coding based on threshold evaluation (>=75, 45-74, <=44).
 * 
 * @param {Object} props.player - Player entity payload { id, name, power, agility, control, speed, strength }.
 * @param {Function} props.onView - Callback returning the id to the parent router for detail navigation.
 */

export function PlayerCard({ player, onView }) {
  const handleView = () => {
    if (onView) {
      onView(player.id);
    }
  };

  const handleDelete = () => {
    console.info('Endpoint de borrado no implementado.');
  };

  // Función auxiliar para determinar el color de la estadística
  const getStatColor = (value) => {
    if (value >= 75) return 'text-emerald-400';
    if (value <= 44) return 'text-red-400';
    return 'text-slate-300';
  };

  // Sub-componente interno para mantener limpio el JSX principal
  const StatBadge = ({ label, value }) => (
    <div className="flex flex-col items-center min-w-[36px]">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`font-mono text-sm font-semibold ${getStatColor(value)}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg flex flex-col md:flex-row justify-between items-center shadow-sm gap-4 transition-colors hover:bg-slate-800/80">
      
      {/* Sección Izquierda: Nombre y Estadísticas */}
      <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
        <span className="text-lg font-medium text-slate-200 min-w-[150px] text-center md:text-left">
          {player.name}
        </span>
        
        {/* Contenedor de Atributos PACCS */}
        <div className="flex gap-2 bg-slate-900/50 px-3 py-1.5 rounded border border-slate-700/50">
          <StatBadge label="pow" value={player.power} />
          <StatBadge label="agi" value={player.agility} />
          <StatBadge label="con" value={player.control} />
          <StatBadge label="spe" value={player.speed} />
          <StatBadge label="str" value={player.strength} />
        </div>
      </div>

      {/* Sección Derecha: Acciones */}
      <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
        {/** <button 
          onClick={handleView}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded transition-colors"
        >
          Ver
        </button>
        
        <button 
          onClick={handleDelete}
          className="px-3 py-1.5 bg-slate-700 text-slate-400 text-sm font-medium rounded cursor-not-allowed opacity-70"
          title="No disponible en este sprint"
        >
          Borrar
        </button>
        */}
      </div>
    </div>
  );
}