import {
  getResource,
  postAction,
} from './apiClient';

export async function obtenerConfiguraciones(
  params = {}
) {
  const response =
    await getResource(
      'configuraciones',
      params
    );

  return response.datos;
}

export async function obtenerConfiguracionesAdministracionApi(
  token
) {
  const response =
    await postAction(
      'obtenerConfiguracionesAdministracion',
      {
        token,
      }
    );

  return response.datos;
}

export async function actualizarConfiguracionExistenteApi(
  token,
  clave,
  nombreVisible,
  valor,
  activo
) {
  const response =
    await postAction(
      'actualizarConfiguracionExistente',
      {
        token,
        clave,
        nombreVisible,
        valor,
        activo,
      }
    );

  return response.datos;
}
