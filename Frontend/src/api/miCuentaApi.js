import { postAction } from './apiClient';

export async function obtenerMiCuentaServidorApi(token) {
  const respuesta = await postAction('obtenermicuentaservidor', { token });
  return respuesta.datos;
}
