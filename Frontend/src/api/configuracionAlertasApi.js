import { postAction } from './apiClient';
export async function obtenerConfiguracionAlertasApi(token) {
  const response = await postAction('obtenerConfiguracionAlertas', { token });
  return response.datos;
}
export async function guardarConfiguracionAlertasApi(token, configuracion) {
  const response = await postAction('guardarConfiguracionAlertas', { token, configuracion });
  return response.datos;
}
