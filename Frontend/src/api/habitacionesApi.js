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
  tipoPersona,
  habitacionNumero = ''
) {
  const response =
    await postAction(
      'obtenercandidatoshabitacion',
      {
        token,
        habitacionId,
        tipoPersona,
        habitacionNumero,
      }
    );

  return response.datos;
}

export async function asignarPersonasHabitacion(
  token,
  habitacionId,
  tipoPersona,
  personaIds,
  habitacionNumero = ''
) {
  const response =
    await postAction(
      'asignarpersonashabitacion',
      {
        token,
        habitacionId,
        tipoPersona,
        personaIds,
        habitacionNumero,
      }
    );

  return response.datos;
}


export async function desasignarPersonaHabitacion(
  token,
  habitacionId,
  tipoPersona,
  personaId
) {
  const response =
    await postAction(
      'desasignarpersonahabitacion',
      {
        token,
        habitacionId,
        tipoPersona,
        personaId,
      }
    );

  return response.datos;
}
