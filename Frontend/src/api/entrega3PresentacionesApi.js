import { postAction } from './apiClient';

export const obtenerRevisionPresentaciones = async (token) => (await postAction('obtenerRevisionPresentaciones', { token })).datos;
export const comentarPresentacion = async (token, temaId, versionId, comentario) => (await postAction('comentarPresentacion', { token, temaId, versionId, comentario })).datos;
export const revisarPresentacionAudiovisuales = async (token, temaId, versionId, decision, comentario='') => (await postAction('revisarPresentacionAudiovisuales', { token, temaId, versionId, decision, comentario })).datos;
export const responderRevisionServidor = async (token, temaId, versionId, decision, comentario='') => (await postAction('responderRevisionServidor', { token, temaId, versionId, decision, comentario })).datos;
export const obtenerNotificacionesTemas = async (token) => (await postAction('obtenerNotificacionesTemas', { token })).datos;
export const marcarNotificacionTemaLeida = async (token, id) => (await postAction('marcarNotificacionTemaLeida', { token, id })).datos;
