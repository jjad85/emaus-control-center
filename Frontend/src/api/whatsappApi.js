import {
  getResource,
  postAction,
} from './apiClient';

export async function obtenerNotificacionesWhatsapp(
  token,
  filtros = {}
) {
  const response = await getResource(
    'notificacioneswhatsapp',
    {
      token,
      ...filtros,
    }
  );

  return response.datos;
}

export async function prepararNotificacionWhatsapp(
  token,
  id
) {
  const response = await postAction(
    'prepararNotificacionWhatsapp',
    { token, id }
  );

  return response.datos;
}

export async function confirmarNotificacionWhatsapp(
  token,
  id
) {
  const response = await postAction(
    'confirmarNotificacionWhatsapp',
    { token, id }
  );

  return response.datos;
}
