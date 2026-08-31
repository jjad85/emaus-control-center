import { getResource } from './apiClient';

export async function obtenerResumenMenu(token) {
  const response = await getResource(
    'resumenmenu',
    { token }
  );

  return response.datos;
}
