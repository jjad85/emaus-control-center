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

export async function consultarAutorizacionesCaminantePublico(tokenAutorizacion) {
  const response = await getResource('autorizacionescaminante', { tokenAutorizacion });
  return response.datos;
}

export async function responderAutorizacionesCaminantePublico(tokenAutorizacion, decision) {
  const response = await postAction('responderAutorizacionesCaminantePublico', { tokenAutorizacion, decision });
  return response.datos;
}
