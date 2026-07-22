import { getResource, postAction } from './apiClient';

export async function buscarPersonaPago(tipo, criterio, id = '') {
  const r = await getResource('buscarpersonapago', { tipo, criterio, id });
  return r.datos;
}

export async function obtenerMiServidorPago(token) {
  const r = await postAction('obtenermiservidorpago', { token });
  return r.datos;
}

export async function reportarPagoPublico(datos) {
  const r = await postAction('reportarpagopublico', { datos });
  return r.datos;
}

export async function obtenerPagos(token, params = {}) {
  const r = await getResource('pagos', { token, ...params });
  return r.datos;
}

export async function obtenerReportePagos(token, params = {}) {
  const r = await getResource('reportepagos', { token, ...params });
  return r.datos;
}

export async function validarPago(token, id, decision) {
  const r = await postAction('validarpago', { token, id, decision });
  return r.datos;
}

export async function obtenerPagosCaminante(token, caminanteId) {
  const r = await getResource('pagoscaminante', { token, caminanteId });
  return r.datos;
}
