import {
  getResource,
  postAction,
} from './apiClient';

export async function obtenerCaminantes(
  params = {}
) {
  const response =
    await getResource(
      'caminantes',
      params
    );

  return response.datos;
}

export async function obtenerOpcionesRegistroCaminante(
  token
) {
  const response =
    await postAction(
      'obtenerOpcionesRegistroCaminante',
      { token }
    );

  return response.datos;
}

export async function registrarCaminanteApi(
  token,
  datos
) {
  const response =
    await postAction(
      'registrarCaminante',
      {
        token,
        datos,
      }
    );

  return response.datos;
}

export async function editarCaminanteApi(
  token,
  id,
  datos
) {
  const response =
    await postAction(
      'editarCaminante',
      {
        token,
        id,
        datos,
      }
    );

  return response.datos;
}

export async function actualizarPagoCaminanteApi(
  token,
  id,
  estadoPago
) {
  const response =
    await postAction(
      'actualizarPagoCaminante',
      {
        token,
        id,
        estadoPago,
      }
    );

  return response.datos;
}

export async function asignarMesaCaminanteApi(
  token,
  id,
  mesa
) {
  const response =
    await postAction(
      'asignarMesaCaminante',
      {
        token,
        id,
        mesa,
      }
    );

  return response.datos;
}

export async function asignarHabitacionCaminanteApi(
  token,
  id,
  habitacion
) {
  const response =
    await postAction(
      'asignarHabitacionCaminante',
      {
        token,
        id,
        habitacion,
      }
    );

  return response.datos;
}

export async function actualizarCartaCaminanteApi(
  token,
  id,
  carta
) {
  const response =
    await postAction(
      'actualizarCartaCaminante',
      {
        token,
        id,
        carta,
      }
    );

  return response.datos;
}

export async function actualizarFotoCaminanteApi(
  token,
  id,
  foto
) {
  const response =
    await postAction(
      'actualizarFotoCaminante',
      {
        token,
        id,
        foto,
      }
    );

  return response.datos;
}
