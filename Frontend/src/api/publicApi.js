import {
  getResource,
  postAction,
} from './apiClient';

export async function obtenerPortalPublico() {
  const response =
    await getResource(
      'portalpublico'
    );

  return response.datos;
}

export async function registrarAspirantePublico(
  datos
) {
  const response =
    await postAction(
      'registrarAspirantePublico',
      {
        datos,
      }
    );

  return response.datos;
}
