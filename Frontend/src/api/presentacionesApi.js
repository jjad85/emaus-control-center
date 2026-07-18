import { getResource } from './apiClient';

export async function obtenerPresentaciones(params = {}) {
  const response = await getResource('presentaciones', params);
  return response.datos;
}
