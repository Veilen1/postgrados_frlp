// app/frontend/src/services/legajoService.js
import { apiClient } from './apiClient';
import { authService } from './authService';

/**
 * Servicio para la gestión y consulta de legajos académicos de Posgrado.
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
};