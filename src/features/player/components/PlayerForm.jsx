import { useState } from 'react';

/**
 * Controlled form component for player creation.
 * Manages local state for PACCS attributes via a bounded stepper UI [20, 100].
 * Enforces the strict domain rule of exactly 300 total attribute points to enable submission.
 *
 * @param {Function} props.onSubmit - Triggered with the validated payload { name, power, agility, control, speed, strength }.
 * @param {Function} props.onCancel - Callback to abort the creation flow.
 * @param {boolean} [props.isLoading=false] - Disables inputs and mutative actions during network transactions.
 */

export function PlayerForm({ onSubmit, onCancel, isLoading = false }) {
  const [formData, setFormData] = useState({
    name: '', power: 60, agility: 60, control: 60, speed: 60, strength: 60
  });

  const handleNameChange = (e) => setFormData(prev => ({ ...prev, name: e.target.value }));

  const handleStatChange = (statName, delta) => {
    setFormData(prev => {
      const newValue = prev[statName] + delta;
      if (newValue < 20 || newValue > 100) return prev;
      return { ...prev, [statName]: newValue };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const statsSum = formData.power + formData.agility + formData.control + formData.speed + formData.strength;
  const isNameValid = formData.name.trim().length > 0;
  const isSumValid = statsSum === 300;
  const areStatsInRange = ['power', 'agility', 'control', 'speed', 'strength'].every(
    stat => formData[stat] >= 20 && formData[stat] <= 100
  );
  const isFormValid = isNameValid && isSumValid && areStatsInRange && !isLoading;

  const sumColorClass = 
    statsSum === 300 ? 'text-emerald-400 bg-emerald-900/30 border-emerald-800' : 
    statsSum > 300 ? 'text-red-400 bg-red-900/30 border-red-800' : 
    'text-yellow-400 bg-yellow-900/30 border-yellow-800';

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
      <div className="mb-6">
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Nombre del Jugador</label>
        <input
          id="name" name="name" type="text" value={formData.name}
          onChange={handleNameChange} disabled={isLoading}
          placeholder="Ej. Lionel Messi"
          className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-sm font-medium text-slate-300">Atributos Técnicos</h3>
          <div className={`px-3 py-1 border rounded font-mono text-sm transition-colors ${sumColorClass}`}>
            Total: {statsSum} / 300
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* 2. Inyectamos los valores y manejadores al subcomponente (StatStepper) */}
          <StatStepper label="Power" name="power" value={formData.power} onChange={handleStatChange} isLoading={isLoading} />
          <StatStepper label="Agility" name="agility" value={formData.agility} onChange={handleStatChange} isLoading={isLoading} />
          <StatStepper label="Control" name="control" value={formData.control} onChange={handleStatChange} isLoading={isLoading} />
          <StatStepper label="Speed" name="speed" value={formData.speed} onChange={handleStatChange} isLoading={isLoading} />
          <StatStepper label="Strength" name="strength" value={formData.strength} onChange={handleStatChange} isLoading={isLoading} />
        </div>
        
        <div className="mt-4 h-4 text-center">
          {statsSum !== 300 && (
            <p className={`text-xs font-medium ${statsSum > 300 ? 'text-red-400' : 'text-yellow-500'}`}>
              {statsSum > 300 ? `Capacidad excedida: Resta ${statsSum - 300} puntos.` : `Puntos disponibles: ${300 - statsSum}.`}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
          Cancelar
        </button>
        <button type="submit" disabled={!isFormValid} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-400 text-white font-medium rounded shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed">
          {isLoading ? 'Creando...' : 'Crear Jugador'}
        </button>
      </div>
    </form>
  );
}

// subcomponente para restringir y actualizar en tiempo real los params de PACSS
const StatStepper = ({ label, name, value, onChange, isLoading }) => {
  const isMin = value <= 20;
  const isMax = value >= 100;

  return (
    <div className="flex flex-col items-center">
      <label className="text-xs font-bold text-slate-400 uppercase mb-2">
        {label}
      </label>
      <div className="flex items-center justify-between w-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(name, -1)}
          disabled={isMin || isLoading}
          className="w-8 h-10 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-300 font-bold transition-colors border-r border-slate-700 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
        >
          -
        </button>
        <span className="font-mono text-slate-200 font-semibold w-full text-center">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(name, 1)}
          disabled={isMax || isLoading}
          className="w-8 h-10 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-slate-300 font-bold transition-colors border-l border-slate-700 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
};