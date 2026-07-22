import {
  getResource,
  postAction,
} from './apiClient';

export async function obtenerMesas(
  params = {}
) {
  const response =
    await getResource(
      'mesas',
      params
    );

  return response.datos;
}

export async function obtenerCandidatosMesaCaminantes(
  token,
  numeroMesa
) {
  const response =
    await postAction(
      'obtenercandidatosmesacaminantes',
      {
        token,
        numeroMesa,
      }
    );

  return response.datos;
}

export async function asignarCaminantesMesa(
  token,
  numeroMesa,
  caminanteIds
) {
  const response =
    await postAction(
      'asignarcaminantesmesa',
      {
        token,
        numeroMesa,
        caminanteIds,
      }
    );

  return response.datos;
}

export async function liberarMesaFueraDeRango(
  token,
  numeroMesa
) {
  const response =
    await postAction(
      'liberarmesafueraderango',
      {
        token,
        numeroMesa,
      }
    );

  return response.datos;
}
