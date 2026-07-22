import { postAction } from './apiClient';

export async function obtenerAuditoriaApi(token, filtros = {}) {
  const response = await postAction('obtenerAuditoriaSistema', {
    token,
    filtros,
  });

  return response.datos;
}
