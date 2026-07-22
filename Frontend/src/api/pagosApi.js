import { getResource, postAction } from './apiClient';

export async function buscarPersonaPago(tipo, criterio, id = '') {
  const r = await getResource('buscarpersonapago', { tipo, criterio, id });
  return r.datos;
}

// Compatibilidad con la pantalla pública/interna de reporte de pagos.
export async function buscarCaminantePago(criterio, id = '') {
  return buscarPersonaPago('Caminante', criterio, id);
}

export async function obtenerValorRetiroPago(tipo) {
  const r = await getResource('configuraciones');
  const configuracion = r.datos || {};
  const claves = tipo === 'Servidor'
    ? ['valorRetiroServidor', 'VALOR_RETIRO_SERVIDOR', 'valor_retiro_servidor']
    : ['valorRetiroActual', 'VALOR_RETIRO_ACTUAL', 'valor_retiro_actual'];

  for (const clave of claves) {
    const valor = Number(String(configuracion[clave] ?? '').replace(/[^0-9.-]/g, ''));
    if (valor > 0) return valor;
  }

  return null;
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
