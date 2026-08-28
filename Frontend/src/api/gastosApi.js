import { getResource, postAction } from './apiClient';

export async function obtenerGastos(token, params = {}) {
  const r = await getResource('gastos', { token, ...params });
  return r.datos;
}

export async function obtenerDistribucionEfectivoGastos(token) {
  const r = await getResource('distribucionefectivogastos', { token });
  return r.datos || [];
}

export async function reportarGasto(token, datos) {
  const r = await postAction('reportargasto', { token, datos });
  return r.datos;
}

export async function validarGasto(token, id, decision) {
  const r = await postAction('validargasto', { token, id, decision });
  return r.datos;
}

export async function revertirGasto(token, id, motivo) {
  const r = await postAction('revertirgasto', { token, id, motivo });
  return r.datos;
}
