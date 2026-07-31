import { postAction } from './apiClient';

export const obtenerHistorialRecursoTemaApi = async (token, temaId, tipoRecurso) =>
  (await postAction('obtenerHistorialRecursoTema', { token, temaId, tipoRecurso })).datos;

export const obtenerReporteRecursosTemaApi = async (token, filtros = {}) =>
  (await postAction('obtenerReporteRecursosTema', { token, filtros })).datos;
