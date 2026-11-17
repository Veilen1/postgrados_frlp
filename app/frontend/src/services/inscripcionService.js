// app/frontend/src/services/inscripcionService.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Helper base para peticiones HTTP
 * Inyecta el token JWT Bearer si existe sesión activa (salvo skipAuth) y parsea errores de FastAPI
 */
async function request(url, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const token = skipAuth ? null : localStorage.getItem('access_token');
  const headers = {
    ...fetchOptions.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    // Si la sesión expiró o las credenciales no son válidas (401), limpiar credenciales vencidas y avisar
    if (response.status === 401) {
      if (!skipAuth) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_profile');
      }
      const error = new Error('Tu sesión ha expirado o no has iniciado sesión. Por favor, iniciá sesión nuevamente para continuar.');
      error.status = 401;
      throw error;
    }

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

    const error = new Error(mensaje);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

export const inscripcionService = {
  /**
   * Obtiene las cohortes abiertas disponibles (sin enviar tokens vencidos)
   * Endpoint: GET /api/v1/cohortes
   */
  obtenerCohortes: async () => {
    return await request(`${API_URL}/cohortes`, {
      method: 'GET',
      skipAuth: true,
    });
  },

  /**
   * Obtiene el legajo del aspirante autenticado (si ya tiene uno en curso)
   * Endpoint: GET /api/v1/legajos/mi-legajo
   */
  obtenerMiLegajo: async () => {
    return await request(`${API_URL}/legajos/mi-legajo`, {
      method: 'GET',
    });
  },

  /**
   * Lista los documentos ya subidos a un legajo para evitar duplicados en reintentos
   * Endpoint: GET /api/v1/legajos/{id}/documentos
   */
  obtenerDocumentos: async (legajoId) => {
    return await request(`${API_URL}/legajos/${legajoId}/documentos`, {
      method: 'GET',
    });
  },

  /**
   * Envía los datos del aspirante a FastAPI para crear el legajo
   * Endpoint: POST /api/v1/legajos
   */
  crearPreinscripcion: async (datosAspirante) => {
    // Validación temprana de sesión antes de enviar
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Tu sesión ha expirado o no has iniciado sesión. Por favor, iniciá sesión nuevamente para continuar.');
    }

    let cohorteId = datosAspirante.cohorte_id;
    if (!cohorteId) {
      try {
        const cohortes = await request(`${API_URL}/cohortes`, { method: 'GET', skipAuth: true });
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
   * Actualiza un legajo existente en estado BORRADOR u OBSERVADO antes de reenviarlo
   * Endpoint: PUT /api/v1/legajos/{id}
   */
  actualizarPreinscripcion: async (legajoId, datosAspirante) => {
    const payload = {
      ...(datosAspirante.dni ? { dni: String(datosAspirante.dni).trim() } : {}),
      ...(datosAspirante.cohorte_id ? { cohorte_id: datosAspirante.cohorte_id } : {}),
      ...(datosAspirante.nombre ? { nombre: String(datosAspirante.nombre).trim() } : {}),
      ...(datosAspirante.apellido ? { apellido: String(datosAspirante.apellido).trim() } : {}),
      ...(datosAspirante.email ? { email: String(datosAspirante.email).trim().toLowerCase() } : {}),
      solicita_beca: Boolean(datosAspirante.solicitaBeca),
      tipo_beca: datosAspirante.tipoBeca || null,
    };

    return await request(`${API_URL}/legajos/${legajoId}`, {
      method: 'PUT',
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

  /**
   * Elimina un documento previo antes de subir su reemplazo
   * Endpoint: DELETE /api/v1/documentos/{id}
   */
  eliminarDocumento: async (documentId) => {
    return await request(`${API_URL}/documentos/${documentId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Envía formalmente el legajo para pasar de BORRADOR/OBSERVADO a ENVIADO
   * Endpoint: POST /api/v1/legajos/{id}/enviar
   */
  enviarLegajo: async (legajoId) => {
    return await request(`${API_URL}/legajos/${legajoId}/enviar`, {
      method: 'POST',
    });
  },
};
