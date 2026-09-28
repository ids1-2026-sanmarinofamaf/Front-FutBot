const BASE_URL = 'http://localhost:8000'; // Ajustar mediante variables de entorno

export const apiClient = async (endpoint, options = {}) => {
  // En la implementación real, el token se extrae del store de Zustand o localStorage
  const token = localStorage.getItem('token'); 

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      console.error('Sesión expirada o token inválido');
      // Aquí se invocaría la limpieza del store de sesión y redirección a /login
    }

    // Intenta parsear el mensaje de error del backend, si existe
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.response || `Error HTTP: ${response.status}`);
  }

  // Manejo de respuestas 204 No Content (comunes en DELETE o PUT)
  if (response.status === 204) return null;

  return await response.json();
};