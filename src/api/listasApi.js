import { getResource } from './apiClient';

export async function obtenerListas(params = {}) {
  const response = await getResource('listas', params);
  return response.datos;
}
