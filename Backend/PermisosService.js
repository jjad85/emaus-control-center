/**
 * ============================================================
 * PERMISOS SERVICE
 * ============================================================
 *
 * Obtiene los permisos por rol desde la hoja PermisosRol.
 *
 * Estructura esperada:
 * Rol | Permiso | Activo
 */

const CLAVE_CACHE_PERMISOS_ROL =
  'EMAUS_PERMISOS_ROL_V1';

const DURACION_CACHE_PERMISOS_SEGUNDOS =
  300;

/**
 * Obtiene la matriz completa de permisos.
 *
 * Ejemplo:
 * {
 *   administrador: [
 *     'REGISTRAR_CAMINANTE',
 *     'EDITAR_CAMINANTE'
 *   ],
 *   tesoreria: [
 *     'ACTUALIZAR_PAGO'
 *   ]
 * }
 */
function obtenerMatrizPermisos() {
  const cache =
    CacheService.getScriptCache();

  const valorCache =
    cache.get(
      CLAVE_CACHE_PERMISOS_ROL
    );

  if (valorCache) {
    try {
      return JSON.parse(
        valorCache
      );
    } catch (error) {
      cache.remove(
        CLAVE_CACHE_PERMISOS_ROL
      );
    }
  }

  const filas =
    leerHojaComoObjetos(
      HOJAS.PERMISOS_ROL
    );

  const matriz = {};

  filas.forEach(
    function(registro) {
      if (
        !convertirBooleano(
          registro.activo
        )
      ) {
        return;
      }

      const rol =
        normalizarTexto(
          registro.rol
        );

      const permiso =
        normalizarPermiso(
          registro.permiso
        );

      if (!rol || !permiso) {
        return;
      }

      if (!matriz[rol]) {
        matriz[rol] = [];
      }

      if (
        !matriz[rol].includes(
          permiso
        )
      ) {
        matriz[rol].push(
          permiso
        );
      }
    }
  );

  cache.put(
    CLAVE_CACHE_PERMISOS_ROL,
    JSON.stringify(matriz),
    DURACION_CACHE_PERMISOS_SEGUNDOS
  );

  return matriz;
}

/**
 * Obtiene los permisos activos de un rol.
 */
function obtenerPermisosPorRol(rol) {
  const rolNormalizado =
    normalizarTexto(rol);

  if (!rolNormalizado) {
    return [];
  }

  const matriz =
    obtenerMatrizPermisos();

  return (
    matriz[rolNormalizado] || []
  );
}

/**
 * Valida que un rol exista y esté activo.
 */
function validarRolActivo(rol) {
  const rolNormalizado =
    normalizarTexto(rol);

  if (!rolNormalizado) {
    throw crearErrorAplicacion(
      'ROL_REQUERIDO',
      'El usuario no tiene un rol configurado.'
    );
  }

  const roles =
    leerHojaComoObjetos(
      HOJAS.ROLES
    );

  const registro =
    roles.find(
      function(item) {
        return (
          normalizarTexto(
            item.rol
          ) === rolNormalizado
        );
      }
    );

  if (!registro) {
    throw crearErrorAplicacion(
      'ROL_NO_CONFIGURADO',
      'El rol "' +
        rol +
        '" no está configurado.'
    );
  }

  if (
    !convertirBooleano(
      registro.activo
    )
  ) {
    throw crearErrorAplicacion(
      'ROL_INACTIVO',
      'El rol "' +
        rol +
        '" se encuentra inactivo.'
    );
  }

  return registro;
}

/**
 * Normaliza un permiso.
 */
function normalizarPermiso(permiso) {
  return String(
    permiso || ''
  )
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

/**
 * Limpia la caché de permisos.
 *
 * Ejecuta esta función después de modificar
 * la hoja PermisosRol.
 */
function limpiarCachePermisos() {
  CacheService
    .getScriptCache()
    .remove(
      CLAVE_CACHE_PERMISOS_ROL
    );

  console.log(
    'Caché de permisos eliminada.'
  );

  return {
    eliminada: true
  };
}

/**
 * Prueba los permisos de un rol.
 */
function probarPermisosAdministrador() {
  const permisos =
    obtenerPermisosPorRol(
      'Administrador'
    );

  console.log(
    JSON.stringify(
      permisos,
      null,
      2
    )
  );
}
