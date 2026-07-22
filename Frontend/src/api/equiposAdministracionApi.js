import { postAction } from './apiClient';

export async function listarEquiposAdministrables(
  token
) {
  const respuesta = await postAction(
    'listarequiposadministrables',
    { token }
  );

  return respuesta.datos || [];
}

export async function guardarEquipoAdministrable(
  token,
  equipo
) {
  const respuesta = await postAction(
    'guardarequipoadministrable',
    {
      token,
      equipo,
    }
  );

  return respuesta.datos;
}

export async function cambiarEstadoEquipoAdministrable(
  token,
  equipoId,
  activo
) {
  const respuesta = await postAction(
    'cambiarestadoequipoadministrable',
    {
      token,
      equipoId,
      activo,
    }
  );

  return respuesta.datos;
}

export async function obtenerAsignacionEquiposServidor(
  token,
  servidorId
) {
  const respuesta = await postAction(
    'obtenerasignacionequiposservidor',
    {
      token,
      servidorId,
    }
  );

  return respuesta.datos;
}

export async function guardarAsignacionEquiposServidor(
  token,
  servidorId,
  equipoPrincipalId,
  equipoPrincipalNombre,
  rolEquipoPrincipal,
  mesaPrincipal,
  equiposApoyoIds
) {
  const respuesta = await postAction(
    'guardarasignacionequiposservidor',
    {
      token,
      servidorId,
      equipoPrincipalId,
      equipoPrincipalNombre,
      rolEquipoPrincipal,
      mesaPrincipal,
      equiposApoyoIds,
    }
  );

  return respuesta.datos;
}


export async function obtenerCandidatosAsignacionEquipo(
  token,
  equipoId
) {
  const respuesta = await postAction(
    'obtenercandidatosasignacionequipo',
    {
      token,
      equipoId,
    }
  );

  return respuesta.datos;
}

export async function asignarServidoresAEquipo(
  token,
  equipoId,
  servidorIds
) {
  const respuesta = await postAction(
    'asignarservidoresequipo',
    {
      token,
      equipoId,
      servidorIds,
    }
  );

  return respuesta.datos;
}


export async function obtenerResumenAsignacionEquipos(
  token
) {
  const respuesta = await postAction(
    'obtenerresumenasignacionequipos',
    { token }
  );

  return respuesta.datos;
}
