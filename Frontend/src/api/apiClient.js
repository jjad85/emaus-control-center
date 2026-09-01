import { emitirSesionExpirada } from '../auth/sessionEvents';
import { administrarGet, invalidarCacheApi } from './requestManager';

const baseURL = import.meta.env.VITE_APPS_SCRIPT_URL;
if (!baseURL) console.warn('Falta configurar VITE_APPS_SCRIPT_URL');

const EVENTO_CARGA_INICIO = 'emaus:api-loading-start';
const EVENTO_CARGA_FIN = 'emaus:api-loading-end';
const EVENTO_DATOS_CAMBIARON = 'emaus:data-changed';
const CODIGOS_SESION_INVALIDA = new Set([
  'SESION_EXPIRADA', 'SESION_REQUERIDA', 'SESION_INVALIDA',
  'SESION_REVOCADA', 'TOKEN_EXPIRADO', 'TOKEN_INVALIDO',
]);

function emitirCarga(nombreEvento) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(nombreEvento));
}

const PREFIJOS_ACCIONES_MUTACION = [
  'actualizar',
  'aprobar',
  'asignar',
  'cambiar',
  'cancelar',
  'cerrar',
  'comentar',
  'confirmar',
  'convertir',
  'crear',
  'desactivar',
  'desasignar',
  'desbloquear',
  'editar',
  'eliminar',
  'enviar',
  'finalizar',
  'guardar',
  'importar',
  'iniciar',
  'liberar',
  'marcar',
  'omitir',
  'pausar',
  'reanudar',
  'registrar',
  'reordenar',
  'reportar',
  'resolver',
  'responder',
  'restablecer',
  'restaurar',
  'retirar',
  'revertir',
  'revisar',
  'subir',
  'validar',
];

function esAccionMutacion(accion) {
  const nombre = String(accion || '').trim().toLowerCase();
  return PREFIJOS_ACCIONES_MUTACION.some((prefijo) =>
    nombre.startsWith(prefijo)
  );
}

function emitirDatosCambiaron(accion) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(EVENTO_DATOS_CAMBIARON, {
      detail: {
        accion: String(accion || ''),
        fecha: Date.now(),
      },
    })
  );
}

function obtenerErrorApi(payload) {
  const errorApi = payload?.errores?.[0];
  return {
    codigo: errorApi?.codigo || '',
    detalle: errorApi?.detalle || payload?.mensaje || 'Error de API',
  };
}

function procesarRespuesta(payload) {
  if (!payload?.ok) {
    const errorApi = obtenerErrorApi(payload);
    if (CODIGOS_SESION_INVALIDA.has(errorApi.codigo)) {
      emitirSesionExpirada(errorApi.detalle);
    }
    const error = new Error(errorApi.detalle);
    error.codigo = errorApi.codigo;
    throw error;
  }
  return payload;
}

async function leerRespuesta(response) {
  const texto = await response.text();
  let payload;
  try {
    payload = JSON.parse(texto);
  } catch {
    const error = new Error(
      response.ok
        ? 'Google Apps Script devolvió una respuesta no válida.'
        : `Google Apps Script respondió temporalmente con estado ${response.status}. Conservamos tu sesión; vuelve a intentar.`
    );
    error.estadoHttp = response.status;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(payload?.mensaje || `Error HTTP ${response.status}`);
    error.estadoHttp = response.status;
    throw error;
  }
  return procesarRespuesta(payload);
}

async function fetchConTimeout(url, options = {}, timeout = 30000) {
  const controlador = new AbortController();
  const temporizador = window.setTimeout(() => controlador.abort(), timeout);
  try {
    return await fetch(url, {
      ...options,
      signal: controlador.signal,
      redirect: 'follow',
      cache: 'no-store',
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error('La operación tardó más de lo esperado. Vuelve a intentarlo.');
      timeoutError.codigo = 'TIMEOUT';
      throw timeoutError;
    }
    throw new Error('No fue posible completar la comunicación con Google Apps Script. Vuelve a intentarlo.');
  } finally {
    window.clearTimeout(temporizador);
  }
}

function construirUrl(recurso, params = {}) {
  const url = new URL(baseURL);
  url.searchParams.set('recurso', recurso);
  Object.entries(params).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      url.searchParams.set(clave, String(valor));
    }
  });
  return url.toString();
}

export async function getResource(
  recurso,
  params = {},
  options = {}
) {
  const mostrarCarga =
    options.mostrarCarga === true;

  if (mostrarCarga) {
    emitirCarga(EVENTO_CARGA_INICIO);
  }

  try {
    return await administrarGet({
      recurso,
      params,
      ejecutar: async () => {
        const response = await fetchConTimeout(
          construirUrl(recurso, params),
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          },
          options.timeout ?? 30000
        );

        return leerRespuesta(response);
      },
    });
  } finally {
    if (mostrarCarga) {
      emitirCarga(EVENTO_CARGA_FIN);
    }
  }
}

export async function postAction(
  accion,
  payload = {},
  options = {}
) {
  const mostrarCarga =
    options.mostrarCarga !== false;

  if (mostrarCarga) {
    emitirCarga(EVENTO_CARGA_INICIO);
  }

  try {
    const response = await fetchConTimeout(baseURL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({ accion, ...payload }),
    }, options.timeout ?? 30000);
    const resultado = await leerRespuesta(response);

    // Toda escritura invalida primero la caché. Después notifica a los
    // useApi montados para que refresquen silenciosamente su información.
    invalidarCacheApi();

    if (
      options.refrescarDatos !== false &&
      esAccionMutacion(accion)
    ) {
      emitirDatosCambiaron(accion);
    }

    return resultado;
  } finally {
    if (mostrarCarga) {
      emitirCarga(EVENTO_CARGA_FIN);
    }
  }
}

export default { get: getResource, post: postAction };
