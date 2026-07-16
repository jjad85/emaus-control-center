import { getResource } from './apiClient';

export async function obtenerHabitaciones(params = {}) {
  const response = await getResource('habitaciones', params);
  return response.datos;
}
