const solicitudesEnCurso = new Map();
const cacheMemoria = new Map();

const TTL_RECURSOS = {
  configuraciones: Infinity,
  portalpublico: 5 * 60 * 1000,
  listas: 5 * 60 * 1000,
  roles: 5 * 60 * 1000,
  permisos: 5 * 60 * 1000,
  dashboard: 30 * 1000,
  documentos: 30 * 1000,
};

function normalizarValor(valor) {
  if (valor === undefined || valor === null) return '';
  if (Array.isArray(valor)) return valor.map(normalizarValor);
  if (typeof valor === 'object') {
    return Object.keys(valor).sort().reduce((resultado, clave) => {
      resultado[clave] = normalizarValor(valor[clave]);
      return resultado;
    }, {});
  }
  return valor;
}

export function construirClaveSolicitud(recurso, params = {}) {
  return `${String(recurso).toLowerCase()}::${JSON.stringify(normalizarValor(params))}`;
}

function obtenerTtl(recurso) {
  return Object.prototype.hasOwnProperty.call(TTL_RECURSOS, recurso)
    ? TTL_RECURSOS[recurso]
    : 0;
}

export async function administrarGet({ recurso, params = {}, ejecutar }) {
  const nombre = String(recurso || '').toLowerCase();
  const clave = construirClaveSolicitud(nombre, params);
  const ahora = Date.now();
  const almacenado = cacheMemoria.get(clave);

  if (almacenado && (almacenado.expira === Infinity || almacenado.expira > ahora)) {
    if (import.meta.env.DEV) console.debug(`[API] ${nombre} → CACHE`);
    return almacenado.valor;
  }

  if (solicitudesEnCurso.has(clave)) {
    if (import.meta.env.DEV) console.debug(`[API] ${nombre} → SOLICITUD COMPARTIDA`);
    return solicitudesEnCurso.get(clave);
  }

  if (import.meta.env.DEV) console.debug(`[API] ${nombre} → RED`);

  const promesa = Promise.resolve()
    .then(ejecutar)
    .then((valor) => {
      const ttl = obtenerTtl(nombre);
      if (ttl > 0 || ttl === Infinity) {
        cacheMemoria.set(clave, {
          valor,
          expira: ttl === Infinity ? Infinity : Date.now() + ttl,
        });
      }
      return valor;
    })
    .catch((error) => {
      if (almacenado) {
        if (import.meta.env.DEV) console.warn(`[API] ${nombre} → CACHE DE RESPALDO`, error);
        return almacenado.valor;
      }
      throw error;
    })
    .finally(() => solicitudesEnCurso.delete(clave));

  solicitudesEnCurso.set(clave, promesa);
  return promesa;
}

export function invalidarCacheApi(recurso = '') {
  const prefijo = String(recurso || '').toLowerCase();
  if (!prefijo) {
    cacheMemoria.clear();
    return;
  }
  Array.from(cacheMemoria.keys()).forEach((clave) => {
    if (clave.startsWith(`${prefijo}::`)) cacheMemoria.delete(clave);
  });
}
