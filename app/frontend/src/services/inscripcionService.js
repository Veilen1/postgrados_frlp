// app/frontend/src/services/inscripcionService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Helper base para peticiones HTTP
 * Realiza el fetch y extrae los mensajes de error de FastAPI (detail)
 */
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    let mensaje = `Error del servidor (${response.status})`;

    // FastAPI devuelve strings o arrays de validación Pydantic en "detail"
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
   * Envía los datos personales y académicos del aspirante a FastAPI
   * Endpoint: POST /api/v1/legajos
   */
  crearPreinscripcion: async (datosAspirante) => {
    // Mapeamos los datos al contrato exacto que espera el backend (docs/ARQUITECTURA_RBAC.md)
    const payload = {
      apellido: datosAspirante.apellido?.trim(),
      nombre: datosAspirante.nombre?.trim(),
      dni: String(datosAspirante.dni)?.trim(),
      email: datosAspirante.email?.trim()?.toLowerCase(),
      domicilio: datosAspirante.domicilio?.trim() || null,
      nacionalidad: datosAspirante.nacionalidad?.trim() || 'Argentina',
      titulo_grado: datosAspirante.titulo?.trim(),
      universidad_origen: datosAspirante.universidad?.trim(),
      anio_egreso: Number(datosAspirante.anioEgreso) || null,
      carrera_elegida: datosAspirante.posgrado,
    };

    return await request(`${API_URL}/legajos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },
  subirDocumento: async (legajoId, tipoDocumento, archivo) => {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('tipo', tipoDocumento);
    // Al usar FormData no seteamos Content-Type manual: el navegador agrega el boundary automáticamente
    return await request(`${API_URL}/legajos/${legajoId}/documentos`, {
      method: 'POST',
      body: formData,
    });
  },
};
