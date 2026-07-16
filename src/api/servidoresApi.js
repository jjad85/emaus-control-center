import { getResource } from './apiClient';

export async function obtenerServidores(params = {}) {
  const response = await getResource('servidores', params);
  return response.datos;
}
