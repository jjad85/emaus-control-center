import { postAction } from './apiClient';

export async function obtenerAdministracionSistemaApi(
  token
) {
  const response =
    await postAction(
      'obtenerAdministracionSistema',
      {
        token,
      }
    );

  return response.datos;
}

export async function desbloquearUsuarioSistemaApi(
  token,
  usuario
) {
  const response =
    await postAction(
      'desbloquearUsuarioSistema',
      {
        token,
        usuario,
      }
    );

  return response.datos;
}

export async function guardarPermisosRolSistemaApi(
  token,
  rol,
  permisos
) {
  const response =
    await postAction(
      'guardarPermisosRolSistema',
      {
        token,
        rol,
        permisos,
      }
    );

  return response.datos;
}


export async function crearUsuarioSistemaApi(token, datos) {
  const response = await postAction('crearUsuarioSistema', { token, datos });
  return response.datos;
}

export async function editarUsuarioSistemaApi(token, id, datos) {
  const response = await postAction('editarUsuarioSistema', { token, id, datos });
  return response.datos;
}
