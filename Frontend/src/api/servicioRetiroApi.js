import { getResource, postAction } from './apiClient';

export async function obtenerAdministracionServicioRetiro(token, tipo) {
  const response = await getResource('administracionservicio', {
    token,
    tipo,
  });
  return response.datos;
}

export async function resolverInscripcionServicioRetiro(
  token,
  tipo,
  id,
  estado,
  observacionesGestion = ''
) {
  const response = await postAction('resolverinscripcionservicio', {
    token,
    tipo,
    id,
    estado,
    observacionesGestion,
  });
  return response.datos;
}
