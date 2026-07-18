import { getResource, postAction } from './apiClient';

export async function obtenerHistoricoMinutogramaApi(params = {}) {
  const response = await getResource('historicoMinutograma', params);
  return response.datos;
}

export async function obtenerComparativoRetirosApi(params = {}) {
  const response = await getResource('comparativoRetiros', params);
  return response.datos;
}

export async function cerrarRetiroMinutogramaApi(token, datos) {
  const response = await postAction('cerrarRetiroMinutograma', { token, datos });
  return response.datos;
}
