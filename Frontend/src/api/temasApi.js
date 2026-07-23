import { getResource, postAction } from './apiClient';

export async function obtenerTemas(token, params = {}) {
  const response = await getResource('temas', { token, ...params });
  return response.datos;
}
export async function registrarTema(token, datos) {
  const response = await postAction('registrarTema', { token, datos });
  return response.datos;
}
export async function editarTema(token, id, datos) {
  const response = await postAction('editarTema', { token, id, datos });
  return response.datos;
}
export async function cambiarEstadoTema(token, id, activo) {
  const response = await postAction('cambiarEstadoTema', { token, id, activo });
  return response.datos;
}
export async function moverTema(token, id, direccion) {
  const response = await postAction('moverTema', { token, id, direccion });
  return response.datos;
}
