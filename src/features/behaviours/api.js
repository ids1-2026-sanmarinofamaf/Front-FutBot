import { apiClient } from '../../shared/api/client';

export const getBehaviours = async () => {
  const data = await apiClient('/clubes/me/behaviours', {
    method: 'GET',
  });
  
  return data.behaviours_list || [];
};


// MOCK para testear a mano la visualización de comportamientos en la lista.
// Comentar la función original de arriba y descomentar el mock a continuación.
// Utilizar la vista BehaviourList en algún lado (ej: App.jsx) como <BehaviourList />
// Solo funciona si se ha implementado BehaviourList.jsx (usar cuando ya estén mergeados ambos tickets.)

// export const getBehaviours = async () => {
//   // Se simula la latencia de red (800ms) para visualizar el estado de carga
//   await new Promise(resolve => setTimeout(resolve, 800));

//   return [
//     { behaviour_id: 1, name: 'Presión Alta', is_valid: true },
//     { behaviour_id: 2, name: 'Bloque Bajo', is_valid: true },
//     { behaviour_id: 3, name: 'Táctica Experimental', is_valid: false },
//     { behaviour_id: 4, name: 'Contraataque Rápido', is_valid: true }
//   ];
// };
