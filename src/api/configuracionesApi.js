import { getResource } from './apiClient';

export async function obtenerConfiguraciones(params = {}) {
  const response = await getResource('configuraciones', params);
  return response.datos;
}
