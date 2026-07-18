import { getResource } from './apiClient';

export async function obtenerDashboard(params = {}) {
  const response = await getResource('dashboard', params);
  return response.datos;
}
