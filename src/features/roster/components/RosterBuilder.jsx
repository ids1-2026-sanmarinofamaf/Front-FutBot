import { useState, useEffect } from 'react';
import { getPlayers } from '../../player/api';
import { getBehaviours } from '../../behaviours/api';

export function RosterBuilder({ onSubmit, onCancel }) {
  const [playersList, setPlayersList] = useState([]);
  const [behavioursList, setBehavioursList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado del formulario
  const [formation, setFormation] = useState('');
  const [starters, setStarters] = useState([
    { player_id: '', initial_behavior_id: '' },
    { player_id: '', initial_behavior_id: '' },
    { player_id: '', initial_behavior_id: '' },
  ]);
  const [subs, setSubs] = useState([
    { player_id: '' },
    { player_id: '' },
    { player_id: '' },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [playersData, behavioursData] = await Promise.all([
          getPlayers(),
          getBehaviours()
        ]);
        setPlayersList(playersData);
        // Filtramos solo los comportamientos válidos.
        setBehavioursList(behavioursData.filter(b => b.is_valid !== false));
      } catch (err) {
        setError('Error al cargar datos del club. ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Validación: Extraer IDs de jugadores seleccionados
  const getSelectedPlayerIds = () => {
    const starterIds = starters.map(s => s.player_id).filter(Boolean);
    const subIds = subs.map(s => s.player_id).filter(Boolean);
    return [...starterIds, ...subIds];
  };

  const selectedIds = getSelectedPlayerIds();

  // Validación principal para habilitar el botón submit
  const isValid = () => {
    const hasFormation = formation !== '';
    const hasAllStarters = starters.every(s => s.player_id !== '' && s.initial_behavior_id !== '');
    const hasAllSubs = subs.every(s => s.player_id !== '');
    const noDuplicates = new Set(selectedIds).size === 6; // 6 jugadores únicos
    
    return hasFormation && hasAllStarters && hasAllSubs && noDuplicates && selectedIds.length === 6;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid()) return;

    // Empaquetar según documento API
    const rosterPayload = {
      formation,
      players: [
        ...starters.map((s, index) => ({
          player_id: parseInt(s.player_id, 10),
          is_starter: true,
          slot: `starter_${index + 1}`, // arbitrario
          initial_behavior_id: parseInt(s.initial_behavior_id, 10)
        })),
        ...subs.map((s) => ({
          player_id: parseInt(s.player_id, 10),
          is_starter: false,
          slot: null,
          initial_behavior_id: null
        }))
      ]
    };

    onSubmit(rosterPayload);
  };

  const handleStarterChange = (index, field, value) => {
    const newStarters = [...starters];
    newStarters[index][field] = value;
    setStarters(newStarters);
  };

  const handleSubChange = (index, value) => {
    const newSubs = [...subs];
    newSubs[index].player_id = value;
    setSubs(newSubs);
  };

  if (loading) return <div className="text-slate-400 p-4">Cargando recursos del club...</div>;
  if (error) return <div className="text-red-400 p-4">{error}</div>;

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Configurar Plantilla</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Formación */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-300 font-semibold">Formación Inicial</label>
          <select 
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            className="bg-slate-900 border border-slate-600 text-slate-200 p-2 rounded focus:ring focus:ring-blue-500"
          >
            <option value="">Seleccione una formación...</option>
            <option value="ofensiva">Ofensiva</option>
            <option value="defensiva">Defensiva</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Titulares */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl text-emerald-400 font-bold border-b border-slate-700 pb-2">Titulares (3)</h3>
            {starters.map((starter, index) => (
              <div key={`starter-${index}`} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg flex flex-col gap-2">
                <select 
                  value={starter.player_id}
                  onChange={(e) => handleStarterChange(index, 'player_id', e.target.value)}
                  className="bg-slate-900 border border-slate-600 text-slate-200 p-2 rounded text-sm"
                >
                  <option value="">Seleccionar Jugador...</option>
                  {playersList.map(p => (
                    <option 
                      key={p.player_id} 
                      value={p.player_id}
                      disabled={selectedIds.includes(p.player_id.toString()) && starter.player_id !== p.player_id.toString()}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
                
                <select 
                  value={starter.initial_behavior_id}
                  onChange={(e) => handleStarterChange(index, 'initial_behavior_id', e.target.value)}
                  className="bg-slate-900 border border-slate-600 text-slate-200 p-2 rounded text-sm"
                >
                  <option value="">Asignar Comportamiento...</option>
                  {behavioursList.map(b => (
                    <option key={b.behaviour_id} value={b.behaviour_id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Suplentes */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl text-blue-400 font-bold border-b border-slate-700 pb-2">Suplentes (3)</h3>
            {subs.map((sub, index) => (
              <div key={`sub-${index}`} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg flex flex-col gap-2">
                <select 
                  value={sub.player_id}
                  onChange={(e) => handleSubChange(index, e.target.value)}
                  className="bg-slate-900 border border-slate-600 text-slate-200 p-2 rounded text-sm"
                >
                  <option value="">Seleccionar Jugador...</option>
                  {playersList.map(p => (
                    <option 
                      key={p.player_id} 
                      value={p.player_id}
                      disabled={selectedIds.includes(p.player_id.toString()) && sub.player_id !== p.player_id.toString()}
                    >
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-slate-700">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-semibold transition-colors"
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit"
            disabled={!isValid()}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Plantilla
          </button>
        </div>
      </form>
    </div>
  );
}