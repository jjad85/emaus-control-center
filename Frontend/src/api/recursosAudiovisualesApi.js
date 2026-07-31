import { postAction } from './apiClient';

export const obtenerGestionRecursosAudiovisuales = async (token) =>
  (await postAction('obtenerGestionRecursosAudiovisuales', { token })).datos;

export const cambiarEstadoRecursoAudiovisual = async (
  token,
  temaId,
  tipo,
  estado,
  observaciones = '',
  archivoDefinitivo = null,
) => (await postAction('cambiarEstadoRecursoAudiovisual', {
  token,
  temaId,
  tipo,
  estado,
  observaciones,
  archivoDefinitivo,
})).datos;
