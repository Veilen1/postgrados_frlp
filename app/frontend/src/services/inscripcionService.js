// app/frontend/src/services/inscripcionService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Helper base para peticiones HTTP
 * Realiza el fetch y extrae los mensajes de error de FastAPI (detail y message)
 */
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    let mensaje = `Error del servidor (${response.status})`;

    // FastAPI devuelve strings o arrays de validación Pydantic en "detail", o "message" en auth
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

export const inscripcionService = {
  /**
   * Obtiene las cohortes abiertas disponibles
   * Endpoint: GET /api/v1/cohortes
   */
  obtenerCohortes: async () => {
    return await request(`${API_URL}/cohortes`, {
      method: 'GET',
    });
  },

  /**
   * Envía los datos del aspirante a FastAPI para crear el legajo
   * Endpoint: POST /api/v1/legajos
   */
  crearPreinscripcion: async (datosAspirante) => {
    let cohorteId = datosAspirante.cohorte_id;
    if (!cohorteId) {
      try {
        const cohortes = await request(`${API_URL}/cohortes`, { method: 'GET' });
        if (Array.isArray(cohortes) && cohortes.length > 0) {
          const cohorteEncontrada = cohortes.find(
            (c) => c.carrera === datosAspirante.posgrado || c.nombre?.includes(datosAspirante.posgrado)
          );
          cohorteId = (cohorteEncontrada || cohortes[0]).id;
        }
      } catch (err) {
        console.warn('No se pudieron obtener cohortes abiertas:', err);
      }
    }

    // Contrato canónico de backend: dni, cohorte_id, solicita_beca, tipo_beca
    const payload = {
      dni: String(datosAspirante.dni)?.trim(),
      ...(cohorteId ? { cohorte_id: cohorteId } : {}),
      solicita_beca: Boolean(datosAspirante.solicitaBeca),
      tipo_beca: datosAspirante.tipoBeca || null,
    };

    return await request(`${API_URL}/legajos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Sube un archivo PDF al legajo creado
   * Endpoint: POST /api/v1/legajos/{id}/documentos
   */
  subirDocumento: async (legajoId, tipoDocumento, archivo) => {
    const formData = new FormData();
    // FastAPI espera el campo 'archivo' y 'tipo'
    formData.append('archivo', archivo);
    formData.append('tipo', tipoDocumento);

    return await request(`${API_URL}/legajos/${legajoId}/documentos`, {
      method: 'POST',
      body: formData,
    });
  },
};
