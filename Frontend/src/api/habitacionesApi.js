import {
  getResource,
  postAction,
} from './apiClient';

export async function obtenerHabitaciones(
  params = {}
) {
  const response =
    await getResource(
      'habitaciones',
      params
    );

  return response.datos;
}

export async function editarHabitacion(
  token,
  habitacionId,
  datos
) {
  const response =
    await postAction(
      'editarhabitacion',
      {
        token,
        habitacionId,
        datos,
      }
    );

  return response.datos;
}

export async function obtenerCandidatosHabitacion(
  token,
  habitacionId,
  tipoPersona
) {
  const response =
    await postAction(
      'obtenercandidatoshabitacion',
      {
        token,
        habitacionId,
        tipoPersona,
      }
    );

  return response.datos;
}

export async function asignarPersonasHabitacion(
  token,
  habitacionId,
  tipoPersona,
  personaIds
) {
  const response =
    await postAction(
      'asignarpersonashabitacion',
      {
        token,
        habitacionId,
        tipoPersona,
        personaIds,
      }
    );

  return response.datos;
}
