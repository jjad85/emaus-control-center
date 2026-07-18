import { getResource } from './apiClient';

export async function obtenerEquipos(params = {}) {
  const response = await getResource('equipos', params);
  return response.datos;
}
