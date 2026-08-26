import {
  getResource,
  postAction,
} from './apiClient';

export async function obtenerAspirantes(
  token,
  filtros = {}
) {
  const response =
    await getResource(
      'aspirantes',
      {
        token,
        ...filtros,
      }
    );

  return response.datos;
}

export async function actualizarEstadoAspiranteApi(
  token,
  id,
  estado,
  observacionesGestion = ''
) {
  const response =
    await postAction(
      'actualizarEstadoAspirante',
      {
        token,
        id,
        estado,
        observacionesGestion,
      }
    );

  return response.datos;
}

export async function convertirAspiranteEnCaminanteApi(
  token,
  id
) {
  const response =
    await postAction(
      'convertirAspiranteEnCaminante',
      {
        token,
        id,
      }
    );

  return response.datos;
}

export async function registrarAspiranteServidorApi(token, datos) {
  const response = await postAction('registrarAspiranteServidor', { token, datos });
  return response.datos;
}

export async function editarAspiranteApi(token, id, datos) {
  const response = await postAction('editaraspirante', { token, id, datos });
  return response.datos;
}
