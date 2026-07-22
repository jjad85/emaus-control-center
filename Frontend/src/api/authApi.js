import { postAction } from './apiClient';

export async function iniciarSesionApi(
  usuario,
  clave
) {
  const response = await postAction(
    'iniciarSesion',
    {
      usuario,
      clave,
    }
  );

  return response.datos;
}

export async function consultarSesionApi(
  token
) {
  const response = await postAction(
    'consultarSesion',
    {
      token,
    }
  );

  return response.datos;
}

export async function cerrarSesionApi(
  token
) {
  const response = await postAction(
    'cerrarSesion',
    {
      token,
    }
  );

  return response.datos;
}


export async function solicitarRecuperacionClaveApi(
  usuario,
  correo
) {
  const response = await postAction(
    'solicitarRecuperacionClave',
    {
      usuario,
      correo,
    }
  );

  return response.datos;
}

export async function restablecerClaveConCodigoApi(
  usuario,
  correo,
  codigo,
  nuevaClave
) {
  const response = await postAction(
    'restablecerClaveConCodigo',
    {
      usuario,
      correo,
      codigo,
      nuevaClave,
    }
  );

  return response.datos;
}

export async function cambiarPrimerPasswordApi(
  token,
  passwordActual,
  passwordNueva
) {
  const response = await postAction(
    'cambiarPrimerPassword',
    {
      token,
      passwordActual,
      passwordNueva,
    }
  );

  return response.datos;
}
