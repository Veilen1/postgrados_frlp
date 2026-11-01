// app/frontend/src/services/authService.js
import { apiClient } from './apiClient';

/**
 * Claves utilizadas para la persistencia en localStorage.
 */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_profile',
};

/**
 * Servicio de Autenticación para el Sistema de Gestión de Posgrado.
 * Gestiona el ciclo de vida de la sesión, tokens JWT y comunicación con FastAPI.
 */
export const authService = {
  /**
   * Inicia sesión contra el endpoint POST /api/v1/auth/login.
   * Envía las credenciales y devuelve los tokens generados por FastAPI.
   * 
   * @param {string} email - Correo del usuario.
   * @param {string} password - Contraseña en texto plano.
   * @returns {Promise<{ access_token: string, refresh_token: string, token_type: string, expires_in: number, user: object }>}
   */
  async login(email, password) {
    const payload = {
      email: email?.trim(),
      password,
    };

    const data = await apiClient('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return data;
  },

  /**
   * Cierra la sesión activa y elimina las credenciales locales.
   */
  logout() {
    // Se implementará en el próximo commit
  },

  /**
   * Devuelve el Access Token actual almacenado.
   * @returns {string | null}
   */
  getToken() {
    return null;
  },

  /**
   * Devuelve los datos del usuario autenticado actual.
   * @returns {object | null}
   */
  getUser() {
    return null;
  },

  /**
   * Verifica si existe una sesión activa válida.
   * @returns {boolean}
   */
  isAuthenticated() {
    return false;
  },

  /**
   * Devuelve los headers de autorización HTTP necesarios para peticiones protegidas.
   * @returns {Record<string, string>}
   */
  getAuthHeaders() {
    return {};
  },
};