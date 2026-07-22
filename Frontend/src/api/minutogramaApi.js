import { getResource, postAction } from './apiClient';

export async function obtenerMinutograma(params = {}) {
  const response = await getResource('minutograma', params);
  return response.datos;
}

export async function registrarActividadMinutogramaApi(token, datos) {
  const response = await postAction('registrarActividadMinutograma', { token, datos });
  return response.datos;
}

export async function editarActividadMinutogramaApi(token, id, datos) {
  const response = await postAction('editarActividadMinutograma', { token, id, datos });
  return response.datos;
}

export async function actualizarEstadoMinutogramaApi(token, id, estado) {
  const response = await postAction('actualizarEstadoMinutograma', {
    token,
    id,
    estado,
  });
  return response.datos;
}

export async function iniciarActividadMinutogramaApi(token, id) {
  const response = await postAction('iniciarActividadMinutograma', { token, id });
  return response.datos;
}


export async function pausarActividadMinutogramaApi(token, id) {
  const response = await postAction('pausarActividadMinutograma', { token, id });
  return response.datos;
}

export async function reanudarActividadMinutogramaApi(token, id) {
  const response = await postAction('reanudarActividadMinutograma', { token, id });
  return response.datos;
}

export async function finalizarActividadMinutogramaApi(token, id) {
  const response = await postAction('finalizarActividadMinutograma', { token, id });
  return response.datos;
}

export async function desactivarActividadMinutogramaApi(token, id) {
  const response = await postAction('desactivarActividadMinutograma', { token, id });
  return response.datos;
}

export async function registrarAlertaMinutogramaApi(
  token,
  id,
  tipo,
  mensaje
) {
  const response = await postAction('registrarAlertaMinutograma', {
    token,
    id,
    tipo,
    mensaje,
  });
  return response.datos;
}

export async function importarActividadesMinutogramaApi(token, actividades) {
  const response = await postAction('importarActividadesMinutograma', { token, actividades });
  return response.datos;
}

export async function reordenarActividadesMinutogramaApi(token, dia, ids) {
  const response = await postAction('reordenarActividadesMinutograma', { token, dia, ids });
  return response.datos;
}
