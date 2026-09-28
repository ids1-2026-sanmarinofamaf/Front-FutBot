import { apiClient } from '../../shared/api/client';

export const getBehaviourById = async (id) => {
  if (id === undefined || id === null) {
    throw new Error("El ID del comportamiento es requerido");
  }
  
  const data = await apiClient(`/clubes/me/behaviours/${id}`, {
    method: 'GET',
  });
  
  return data; 

/*
// Mock para testear a mano la visualización de un comportamiento en específico.
// comentar código original de arriba y probar en algún lado:
// <BehaviourDetail 
//        id={1} 
//        onBack={() => console.log('Acción: Volver al listado')} 
//      /> 
// Simulación de latencia de red (800ms)
await new Promise(resolve => setTimeout(resolve, 800));

const mockDatabase = {
    1: { 
    behaviour_id: 1, 
    name: 'Presión Alta', 
    code: 'def start_press():\n    # Inicia presión en bloque alto\n    return True', 
    is_valid: true 
    },
    2: { 
    behaviour_id: 2, 
    name: 'Bloque Bajo', 
    code: 'def defend_deep():\n    # Repliegue intensivo\n    return True', 
    is_valid: true 
    }
};

// Simulación de respuesta exitosa o error 404
if (mockDatabase[id]) {
    return mockDatabase[id];
} else {
    throw new Error("No se encontró el comportamiento solicitado (Error 404)");
}
*/
};