import {
  getResource,
  postAction,
} from './apiClient';

export async function obtenerMinutograma(
  params = {}
) {
  const response =
    await getResource(
      'minutograma',
      params
    );

  return response.datos;
}

export async function registrarActividadMinutogramaApi(
  token,
  datos
) {
  const response =
    await postAction(
      'registrarActividadMinutograma',
      {
        token,
        datos,
      }
    );

  return response.datos;
}

export async function editarActividadMinutogramaApi(
  token,
  id,
  datos
) {
  const response =
    await postAction(
      'editarActividadMinutograma',
      {
        token,
        id,
        datos,
      }
    );

  return response.datos;
}

export async function actualizarEstadoMinutogramaApi(
  token,
  id,
  estado
) {
  const response =
    await postAction(
      'actualizarEstadoMinutograma',
      {
        token,
        id,
        estado,
      }
    );

  return response.datos;
}

export async function desactivarActividadMinutogramaApi(
  token,
  id
) {
  const response =
    await postAction(
      'desactivarActividadMinutograma',
      {
        token,
        id,
      }
    );

  return response.datos;
}
