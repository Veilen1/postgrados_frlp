// app/frontend/src/services/apiClient.js

/**
 * URL base de la API backend de Posgrado.
 * Toma la variable de entorno de Vite si existe, o usa el puerto 8000 por defecto.
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Cliente HTTP base para realizar peticiones a la API.
 * Parsea respuestas JSON y unifica el formato de errores que devuelve FastAPI.
 *
 * @param {string} endpoint - Ruta relativa (ej: '/auth/login', '/legajos')
 * @param {RequestInit} [options={}] - Opciones de fetch (method, headers, body, etc.)
 * @returns {Promise<any>}
 */
export async function apiClient(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, options);

  // Si la respuesta no es 2xx, parseamos el error del backend
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    let mensaje = `Error del servidor (${response.status})`;

    // FastAPI devuelve strings o arrays de Pydantic en 'detail', o 'message' en auth
    if (typeof errorBody?.detail === 'string') {
      mensaje = errorBody.detail;
    } else if (Array.isArray(errorBody?.detail)) {
      mensaje = errorBody.detail.map((err) => `${err.loc?.slice(-1)}: ${err.msg}`).join(', ');
    } else if (errorBody?.message) {
      mensaje = errorBody.message;
    }

    const error = new Error(mensaje);
    error.status = response.status;
    error.data = errorBody;
    throw error;
  }

  // Si el backend devuelve 204 No Content, retornamos null
  if (response.status === 204) {
    return null;
  }

  return await response.json();
}