import { getResource } from './apiClient';

export async function obtenerMesas(params = {}) {
  const response = await getResource('mesas', params);
  return response.datos;
}
