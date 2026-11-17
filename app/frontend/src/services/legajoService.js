// app/frontend/src/services/legajoService.js
import { apiClient, API_URL } from './apiClient';
import { authService } from './authService';

/**
 * Servicio para la gestión, auditoría y consulta de legajos académicos de Posgrado.
 */
export const legajoService = {
  /**
   * Obtiene el listado paginado de legajos desde el backend.
   * Endpoint: GET /api/v1/legajos
   * Requiere rol ADMIN_POSGRADO o SUPERADMIN.
   * 
   * @param {object} [params={}] - Parámetros de consulta
   * @param {number} [params.page=1] - Número de página (1-based)
   * @param {number} [params.pageSize=50] - Cantidad de registros por página
   * @param {string} [params.estado] - Filtro opcional por estado de legajo
   * @param {string} [params.cohorteId] - Filtro opcional por UUID de cohorte
   * @returns {Promise<{ items: Array<object>, total: number, page: number, page_size: number }>}
   */
  async obtenerLegajos({ page = 1, pageSize = 50, estado, cohorteId } = {}) {
    const queryParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });

    if (estado && estado !== 'Todos') {
      queryParams.append('estado', estado);
    }

    if (cohorteId) {
      queryParams.append('cohorte_id', cohorteId);
    }

    const endpoint = `/legajos?${queryParams.toString()}`;

    return await apiClient(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
    });
  },

  /**
   * Obtiene el detalle completo de un legajo por su ID.
   * Endpoint: GET /api/v1/legajos/{id}
   * 
   * @param {string} legajoId - UUID del legajo
   * @returns {Promise<object>}
   */
  async obtenerLegajoPorId(legajoId) {
    return await apiClient(`/legajos/${legajoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
    });
  },

  /**
   * Actualiza el estado de un legajo (Aprobar, Observar, Rechazar).
   * Al Aprobar, el backend genera automáticamente el número de legajo definitivo.
   * Endpoint: PATCH /api/v1/legajos/{id}/estado
   * Requiere rol ADMIN_POSGRADO o SUPERADMIN.
   * 
   * @param {string} legajoId - UUID del legajo
   * @param {string} estado - Estado destino (APROBADO, OBSERVADO, RECHAZADO, EN_REVISION)
   * @param {string} [motivoObservacion] - Motivo obligatorio si pasa a OBSERVADO
   * @returns {Promise<object>}
   */
  async actualizarEstadoLegajo(legajoId, estado, motivoObservacion = null) {
    const payload = {
      estado,
      ...(motivoObservacion ? { motivo_observacion: motivoObservacion.trim() } : {}),
    };

    return await apiClient(`/legajos/${legajoId}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Obtiene el listado de documentos PDF adjuntados a un legajo.
   * Endpoint: GET /api/v1/legajos/{id}/documentos
   * 
   * @param {string} legajoId - UUID del legajo
   * @returns {Promise<Array<{ id: string, legajo_id: string, tipo: string, nombre_original: string, tamanio_bytes: number, fecha_subida: string }>>}
   */
  async obtenerDocumentosLegajo(legajoId) {
    return await apiClient(`/legajos/${legajoId}/documentos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.getAuthHeaders(),
      },
    });
  },

  /**
   * Descarga un archivo PDF de la API forzando la descarga en el navegador.
   * Endpoint: GET /api/v1/documentos/{id}/download
   * 
   * @param {string} documentId - UUID del documento
   * @param {string} [nombreOriginal] - Nombre sugerido para el archivo descargado
   */
  async descargarDocumento(documentId, nombreOriginal = 'documento.pdf') {
    const url = `${API_URL}/documentos/${documentId}/download`;
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });
    } catch (err) {
      if (
        err instanceof TypeError ||
        err?.name === 'TypeError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('network error')
      ) {
        const networkError = new Error('No se pudo conectar con el servidor de Posgrado. Verifique que el backend esté activo.');
        networkError.status = 0;
        networkError.originalError = err;
        throw networkError;
      }
      throw err;
    }

    if (!response.ok) {
      let mensaje = `Error al descargar el archivo (${response.status})`;
      try {
        const errorText = await response.text();
        const errorBody = JSON.parse(errorText);
        if (typeof errorBody?.detail === 'string') {
          mensaje = errorBody.detail;
        } else if (Array.isArray(errorBody?.detail)) {
          mensaje = errorBody.detail.map((err) => `${err.loc?.slice(-1)}: ${err.msg}`).join(', ');
        } else if (errorBody?.message) {
          mensaje = errorBody.message;
        }
      } catch {
        // Si no es JSON o falla el parseo, se mantiene el mensaje por defecto
      }
      const error = new Error(mensaje);
      error.status = response.status;
      throw error;
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = nombreOriginal;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },

  /**
   * Obtiene una URL temporal (Blob) para previsualizar el PDF en una pestaña o iframe.
   * Endpoint: GET /api/v1/documentos/{id}/download
   * 
   * @param {string} documentId - UUID del documento
   * @returns {Promise<string>} Blob URL que puede ser abierta con window.open()
   */
  async obtenerUrlVisorDocumento(documentId) {
    const url = `${API_URL}/documentos/${documentId}/download`;
    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: authService.getAuthHeaders(),
      });
    } catch (err) {
      if (
        err instanceof TypeError ||
        err?.name === 'TypeError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('network error')
      ) {
        const networkError = new Error('No se pudo conectar con el servidor de Posgrado. Verifique que el backend esté activo.');
        networkError.status = 0;
        networkError.originalError = err;
        throw networkError;
      }
      throw err;
    }

    if (!response.ok) {
      let mensaje = `Error al abrir el documento (${response.status})`;
      try {
        const errorText = await response.text();
        const errorBody = JSON.parse(errorText);
        if (typeof errorBody?.detail === 'string') {
          mensaje = errorBody.detail;
        } else if (Array.isArray(errorBody?.detail)) {
          mensaje = errorBody.detail.map((err) => `${err.loc?.slice(-1)}: ${err.msg}`).join(', ');
        } else if (errorBody?.message) {
          mensaje = errorBody.message;
        }
      } catch {
        // Si no es JSON, se conserva el mensaje por defecto
      }
      const error = new Error(mensaje);
      error.status = response.status;
      throw error;
    }

    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  },
};
