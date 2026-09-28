import { apiClient } from '../../shared/api/client';

export const getBehaviours = async () => {
  const data = await apiClient('/clubes/me/behaviours', {
    method: 'GET',
  });
  
  return data.behaviours_list || [];
};

/*
// MOCK para testear a mano la visualización de comportamientos en la lista.
// Comentar el código original y descomentar el mock de acontinuación.
// Utilizar la vista BehaviourList en algún lado (ej: App.jsx) como <div><BehaviourList /></div>
export const getBehaviours = async () => {
  
  // Se simula la latencia de red (opcional, para visualizar el estado de carga)
  await new Promise(resolve => setTimeout(resolve, 800));

  return [
    { behaviour_id: 1, name: 'Presión Alta', code: 'press_high()', is_valid: true },
    { behaviour_id: 2, name: 'Bloque Bajo', code: 'defend_deep()', is_valid: true },
    { behaviour_id: 3, name: 'Táctica Experimental', code: 'test_formation()', is_valid: false },
    { behaviour_id: 4, name: 'Contraataque Rápido', code: 'counter_fast()', is_valid: true }
  ];
};
*/