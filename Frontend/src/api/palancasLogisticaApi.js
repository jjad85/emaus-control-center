import { postAction } from './apiClient';

export const obtenerGestionPalancasLogisticaApi = async (token) =>
  (await postAction('obtenerGestionPalancasLogistica', { token })).datos;

export const actualizarPalancaLogisticaApi = async (token, temaId, datos) =>
  (await postAction('actualizarPalancaLogistica', { token, temaId, datos })).datos;
