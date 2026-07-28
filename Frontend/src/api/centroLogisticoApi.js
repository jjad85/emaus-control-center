import { getResource } from './apiClient';

export async function obtenerCentroLogisticoApi(token) {
  const response = await getResource('centrologistico', { token });
  return response.datos;
}
