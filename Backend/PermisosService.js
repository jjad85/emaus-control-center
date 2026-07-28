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
    normalizarCodigoRol_(rol);

  if (!rolNormalizado) {
    return [];
  }

  const matriz =
    obtenerMatrizPermisos();

  /*
   * El administrador siempre recibe todos los permisos activos de la matriz.
   * Esto evita que una migración de nombres (Administrador -> ADMIN) deje al
   * administrador sin acceso por tener filas antiguas en PermisosRol.
   */
  if (rolNormalizado === 'admin') {
    const todos = [];

    Object.keys(matriz).forEach(
      function(codigoRol) {
        (matriz[codigoRol] || []).forEach(
          function(permiso) {
            if (!todos.includes(permiso)) {
              todos.push(permiso);
            }
          }
        );
      }
    );

    return todos;
  }

  return (
    matriz[rolNormalizado] || []
  );
}

/**
 * Normaliza nombres históricos y nombres visibles al código estable del rol.
 * Las autorizaciones nunca deben depender del texto mostrado en pantalla.
 */
function normalizarCodigoRol_(rol) {
  const valor = normalizarTexto(rol);

  const alias = {
    'administrador': 'admin',
    'administrador del sistema': 'admin',
    'admin': 'admin',
    'equipo de audiovisuales': 'audiovisual',
    'coordinador de audiovisuales': 'audiovisual',
    'audiovisuales': 'audiovisual',
    'audiovisual': 'audiovisual',
    'lider del retiro': 'lider_retiro',
    'lideres del retiro': 'lider_retiro',
    'coordinador general': 'lider_retiro',
    'coordinador general del retiro': 'lider_retiro',
    'lider_retiro': 'lider_retiro',
    'lider de mesa': 'lider_mesa',
    'lideres de mesa': 'lider_mesa',
    'lider_mesa': 'lider_mesa',
    'servidor': 'servidor',
    'servidores': 'servidor',
    'equipo de registro': 'registro',
    'coordinador de registro': 'registro',
    'registro': 'registro',
    'tesoreria': 'tesoreria',
    'campanero': 'campanero'
  };

  return alias[valor] || valor.replace(/\s+/g, '_');
}

/**
 * Valida que un rol exista y esté activo.
 */
function validarRolActivo(rol) {
  const rolNormalizado =
    normalizarCodigoRol_(rol);

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
          normalizarCodigoRol_(
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

/** Valida un permiso exacto o un permiso TODO asociado. */
function tienePermisoSesion(token, permiso) {
  const sesion = obtenerSesion(token);
  const permisos = obtenerPermisosPorRol(sesion.rol);
  const requerido = normalizarPermiso(permiso);
  if (permisos.indexOf(requerido) >= 0) return true;
  const equivalencias = {
    CONSULTAR_ASPIRANTES: ['ASPIRANTES_VER_DETALLE'],
    NOTIFICAR_ASPIRANTE: ['ASPIRANTES_NOTIFICAR_PREINSCRIPCION'],
    CONVERTIR_ASPIRANTE: ['ASPIRANTES_CAMBIAR_ESTADO'],
    ACTUALIZAR_ESTADO_ASPIRANTE: ['ASPIRANTES_CAMBIAR_ESTADO'],
    CONSULTAR_CAMINANTES: ['CAMINANTES_VER_DETALLE'],
    EDITAR_CAMINANTE: ['CAMINANTES_EDITAR'],
    REGISTRAR_CAMINANTE: ['CAMINANTES_REGISTRAR'],
    ASIGNAR_MESA: ['CAMINANTES_ASIGNAR_MESA', 'MESAS_ASIGNAR_CAMINANTE'],
    ASIGNAR_HABITACION: ['CAMINANTES_ASIGNAR_HABITACION', 'HABITACIONES_ASIGNAR_PERSONA'],
    ACTUALIZAR_CARTA: ['CAMINANTES_REPORTAR_CARTA'],
    ACTUALIZAR_FOTO: ['CAMINANTES_REPORTAR_FOTO'],
    CONSULTAR_SERVIDORES: ['SERVIDORES_VER_DETALLE'],
    EDITAR_SERVIDOR: ['SERVIDORES_EDITAR'],
    EDITAR_EQUIPOS: ['EQUIPOS_CREAR', 'EQUIPOS_ASIGNAR_SERVIDOR', 'EQUIPOS_EDITAR', 'EQUIPOS_RETIRAR_SERVIDOR'],
    GESTIONAR_PRESENTACIONES: ['PRESENTACIONES_TODO'],
    GESTIONAR_PAGOS: ['PAGOS_VER_ESTADOS_CUENTA'],
    ADMINISTRAR_TEMAS: ['TEMAS_VER_DETALLE', 'TEMAS_EDITAR', 'TEMAS_CREAR', 'TEMAS_DESACTIVAR'],
    EXPORTAR_ACTIVIDADES_PASO_A_PASO: ['PASO_A_PASO_EXPORTAR'],
    IMPORTAR_ACTIVIDADES_PASO_A_PASO: ['PASO_A_PASO_IMPORTAR'],
    CREAR_ACTIVIDADES_PASO_A_PASO: ['PASO_A_PASO_REGISTRAR_ACTIVIDAD'],
    EDITAR_ACTIVIDAD_PASO_A_PASO: ['PASO_A_PASO_EDITAR'],
    ACTUALIZAR_ESTADO_PASO_A_PASO: ['PASO_A_PASO_CAMBIAR_ESTADO'],
    MOVER_ACTIVIDADES_PASO_A_PASO: ['PASO_A_PASO_CAMBIAR_ORDEN'],
    INICIAR_ACTIVIDAD_PASO_A_PASO: ['PASO_A_PASO_INICIAR'],
    PAUSAR_ACTIVIDAD_PASO_A_PASO: ['PASO_A_PASO_CAMBIAR_ESTADO'],
    REANUDAR_ACTIVIDAD_PASO_A_PASO: ['PASO_A_PASO_CAMBIAR_ESTADO'],
    FINALIZAR_ACTIVIDAD_PASO_A_PASO: ['PASO_A_PASO_CAMBIAR_ESTADO'],
    REPORTAR_PAGO_REGISTRAR: ['REPORTAR_PAGO_TODO'],
  };
  return (equivalencias[requerido] || []).some(function(codigo) {
    return permisos.indexOf(normalizarPermiso(codigo)) >= 0;
  });
}

function validarPermisoSesion(token, permiso, mensaje) {
  const sesion = obtenerSesion(token);
  if (!tienePermisoSesion(token, permiso)) {
    throw crearErrorAplicacion('PERMISO_DENEGADO', mensaje || 'No tiene permisos para realizar esta acción.');
  }
  return sesion;
}
