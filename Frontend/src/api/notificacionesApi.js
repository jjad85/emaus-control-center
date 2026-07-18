import {
  getResource,
} from './apiClient';

/**
 * Consulta las notificaciones dinámicas del usuario autenticado.
 */
export async function obtenerNotificaciones(
  token
) {
  if (!token) {
    return {
      total: 0,
      totalPendientes: 0,
      items: [],
    };
  }

  const response =
    await getResource(
      'notificaciones',
      {
        token,
      }
    );

  return response.datos;
}
