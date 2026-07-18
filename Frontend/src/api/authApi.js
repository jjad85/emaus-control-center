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
