import axios from 'axios';
import {
  emitirSesionExpirada,
} from '../auth/sessionEvents';

const baseURL =
  import.meta.env.VITE_APPS_SCRIPT_URL;

if (!baseURL) {
  console.warn(
    'Falta configurar VITE_APPS_SCRIPT_URL'
  );
}

const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
});

function obtenerErrorApi(
  payload
) {
  const errorApi =
    payload?.errores?.[0];

  return {
    codigo:
      errorApi?.codigo || '',

    detalle:
      errorApi?.detalle ||
      payload?.mensaje ||
      'Error de API',
  };
}

function procesarRespuesta(
  payload
) {
  if (!payload?.ok) {
    const errorApi =
      obtenerErrorApi(
        payload
      );

    if (
      errorApi.codigo ===
        'SESION_EXPIRADA' ||
      errorApi.codigo ===
        'SESION_REQUERIDA' ||
      errorApi.codigo ===
        'SESION_INVALIDA'
    ) {
      emitirSesionExpirada(
        errorApi.detalle
      );
    }

    const error =
      new Error(
        errorApi.detalle
      );

    error.codigo =
      errorApi.codigo;

    throw error;
  }

  return payload;
}

function procesarError(error) {
  if (error?.codigo) {
    throw error;
  }

  const payload =
    error?.response?.data;

  if (payload) {
    return procesarRespuesta(
      payload
    );
  }

  throw new Error(
    error?.message ||
      'No fue posible conectar con la API'
  );
}

export async function getResource(
  recurso,
  params = {}
) {
  try {
    const response =
      await apiClient.get('', {
        params: {
          recurso,
          ...params,
          t: Date.now(),
        },
      });

    return procesarRespuesta(
      response.data
    );
  } catch (error) {
    return procesarError(
      error
    );
  }
}

export async function postAction(
  accion,
  payload = {}
) {
  try {
    const body =
      JSON.stringify({
        accion,
        ...payload,
      });

    const response =
      await axios.post(
        baseURL,
        body,
        {
          timeout: 30000,

          headers: {
            Accept:
              'application/json',

            'Content-Type':
              'text/plain;charset=UTF-8',
          },
        }
      );

    return procesarRespuesta(
      response.data
    );
  } catch (error) {
    return procesarError(
      error
    );
  }
}

export default apiClient;
