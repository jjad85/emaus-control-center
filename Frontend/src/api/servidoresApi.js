import { getResource, postAction } from './apiClient';

export async function obtenerServidores(params = {}) {
  const response = await getResource('servidores', params);
  return response.datos;
}

export async function obtenerOpcionesGestionServidorApi(token, id) {
  const response = await postAction('obtenerOpcionesGestionServidor', { token, id });
  return response.datos;
}

export async function editarServidorApi(token, id, datos) {
  const response = await postAction('editarServidor', { token, id, datos });
  return response.datos;
}

export async function actualizarPagoServidorApi(token, id, estadoPago) {
  const response = await postAction('actualizarPagoServidor', { token, id, estadoPago });
  return response.datos;
}

export async function asignarTemaServidorApi(token, id, temaId) {
  const response = await postAction('asignarTemaServidor', { token, id, temaId });
  return response.datos;
}

export async function asignarMesaServidorApi(token, id, tipoAsignacion, mesa, equipo, rolMesa) {
  const response = await postAction('asignarMesaServidor', { token, id, tipoAsignacion, mesa, equipo, rolMesa });
  return response.datos;
}

export async function asignarEquipoServidorApi(token, id, equipo, rolEquipo) {
  const response = await postAction('asignarEquipoServidor', { token, id, equipo, rolEquipo });
  return response.datos;
}

export async function asignarHabitacionServidorApi(token, id, habitacion) {
  const response = await postAction('asignarHabitacionServidor', { token, id, habitacion });
  return response.datos;
}
