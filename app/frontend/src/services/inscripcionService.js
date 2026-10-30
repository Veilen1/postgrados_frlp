const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    let mensaje = `Error del servidor (${response.status})`;
  
    if (typeof errorBody?.detail === 'string') {
      mensaje = errorBody.detail;
    } else if (Array.isArray(errorBody?.detail)) {
   
      mensaje = errorBody.detail.map((err) => `${err.loc?.slice(-1)}: ${err.msg}`).join(', ');
    } else if (errorBody?.message) {
      mensaje = errorBody.message;
    }
    throw new Error(mensaje);
  }
  return await response.json();
}