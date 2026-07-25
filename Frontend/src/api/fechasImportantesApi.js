import { getResource, postAction } from './apiClient';

export async function obtenerFechasImportantesApi(token, params = {}) {
  const response = await getResource('fechasImportantes', { token, ...params });
  return response.datos;
}

export async function registrarFechaImportanteApi(token, datos) {
  const response = await postAction('registrarFechaImportante', { token, datos });
  return response.datos;
}

export async function editarFechaImportanteApi(token, id, datos) {
  const response = await postAction('editarFechaImportante', { token, id, datos });
  return response.datos;
}

export async function eliminarFechaImportanteApi(token, id) {
  const response = await postAction('eliminarFechaImportante', { token, id });
  return response.datos;
}

export async function restaurarFechaImportanteApi(token, id) {
  const response = await postAction('restaurarFechaImportante', { token, id });
  return response.datos;
}
