/**
 * ============================================================
 * AUTH SERVICE
 * ============================================================
 */

/**
 * Duración predeterminada:
 * 14.400 segundos = 4 horas.
 */
const DURACION_SESION_PREDETERMINADA_SEGUNDOS =
  14400;

/**
 * CacheService admite máximo:
 * 21.600 segundos = 6 horas.
 */
const DURACION_SESION_MAXIMA_SEGUNDOS =
  21600;

/**
 * Duración mínima:
 * 60 segundos.
 */
const DURACION_SESION_MINIMA_SEGUNDOS =
  60;

/**
 * Obtiene la duración de sesión desde Configuraciones.
 *
 * Clave esperada:
 * duracionSesionSegundos
 */
function obtenerDuracionSesionSegundos() {
  const segundos =
    Number(
      obtenerConfiguracion(
        'duracionSesionSegundos',
        DURACION_SESION_PREDETERMINADA_SEGUNDOS
      )
    );

  if (!Number.isFinite(segundos)) {
    throw crearErrorAplicacion(
      'DURACION_SESION_INVALIDA',
      'La duración de la sesión debe ser numérica.'
    );
  }

  const segundosEnteros =
    Math.floor(segundos);

  if (
    segundosEnteros <
      DURACION_SESION_MINIMA_SEGUNDOS ||
    segundosEnteros >
      DURACION_SESION_MAXIMA_SEGUNDOS
  ) {
    throw crearErrorAplicacion(
      'DURACION_SESION_INVALIDA',
      'La duración de la sesión debe estar entre ' +
        DURACION_SESION_MINIMA_SEGUNDOS +
        ' y ' +
        DURACION_SESION_MAXIMA_SEGUNDOS +
        ' segundos.'
    );
  }

  return segundosEnteros;
}

/**
 * Inicia sesión.
 */
function iniciarSesion(
  usuarioIngresado,
  claveIngresada
) {
  const usuario =
    normalizarTexto(
      usuarioIngresado
    );

  const clave =
    String(
      claveIngresada || ''
    );

  if (!usuario || !clave) {
    throw crearErrorAplicacion(
      'CREDENCIALES_REQUERIDAS',
      'Debe ingresar usuario y contraseña.'
    );
  }

  const registro =
    buscarUsuarioPorUsuario(
      usuario
    );

  if (!registro) {
    throw crearErrorAplicacion(
      'CREDENCIALES_INVALIDAS',
      'Usuario o contraseña incorrectos.'
    );
  }

  if (
    !convertirBooleano(
      registro.activo
    )
  ) {
    throw crearErrorAplicacion(
      'USUARIO_INACTIVO',
      'El usuario se encuentra inactivo.'
    );
  }

  const passwordValido =
    validarPassword(
      clave,
      registro.salt,
      registro.claveHash
    );

  if (!passwordValido) {
    throw crearErrorAplicacion(
      'CREDENCIALES_INVALIDAS',
      'Usuario o contraseña incorrectos.'
    );
  }

  validarRolActivo(
    registro.rol
  );

  const permisos =
    obtenerPermisosPorRol(
      registro.rol
    );

  const token =
    generarTokenSesion();

  const duracionSesionSegundos =
    obtenerDuracionSesionSegundos();

  const fechaInicio =
    new Date();

  const fechaExpiracion =
    new Date(
      fechaInicio.getTime() +
        duracionSesionSegundos *
          1000
    );

  const sesion = {
    usuario:
      registro.usuario,

    nombre:
      registro.nombre,

    rol:
      registro.rol,

    permisos:
      permisos,

    fechaInicio:
      fechaInicio.toISOString(),

    fechaExpiracion:
      fechaExpiracion.toISOString(),

    duracionSesionSegundos:
      duracionSesionSegundos
  };

  guardarSesion(
    token,
    sesion,
    duracionSesionSegundos
  );

  registrarAuditoria({
    usuario:
      registro.usuario,

    nombre:
      registro.nombre,

    accion:
      'INICIAR_SESION',

    entidad:
      'Seguridad',

    idRegistro:
      registro.id,

    detalle:
      'Inicio de sesión correcto. Rol: ' +
      registro.rol
  });

  return {
    token:
      token,

    usuario:
      sesion.usuario,

    nombre:
      sesion.nombre,

    rol:
      sesion.rol,

    permisos:
      sesion.permisos,

    fechaInicio:
      sesion.fechaInicio,

    fechaExpiracion:
      sesion.fechaExpiracion,

    duracionSesionSegundos:
      duracionSesionSegundos,

    segundosRestantes:
      duracionSesionSegundos
  };
}

/**
 * Genera un token aleatorio.
 */
function generarTokenSesion() {
  const origen = [
    Utilities.getUuid(),
    Utilities.getUuid(),
    new Date().getTime(),
    Math.random()
  ].join(':');

  const firma =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      origen,
      Utilities.Charset.UTF_8
    );

  return Utilities.base64EncodeWebSafe(
    firma
  );
}

/**
 * Guarda una sesión temporal.
 */
function guardarSesion(
  token,
  sesion,
  duracionSesionSegundos
) {
  const cache =
    CacheService.getScriptCache();

  cache.put(
    construirClaveSesion(token),
    JSON.stringify(sesion),
    duracionSesionSegundos
  );
}

/**
 * Consulta una sesión por token.
 */
function obtenerSesion(token) {
  const tokenLimpio =
    String(
      token || ''
    ).trim();

  if (!tokenLimpio) {
    throw crearErrorAplicacion(
      'SESION_REQUERIDA',
      'Debe iniciar sesión.'
    );
  }

  const cache =
    CacheService.getScriptCache();

  const claveSesion =
    construirClaveSesion(
      tokenLimpio
    );

  const valor =
    cache.get(
      claveSesion
    );

  if (!valor) {
    throw crearErrorAplicacion(
      'SESION_EXPIRADA',
      'La sesión expiró. Inicie sesión nuevamente.'
    );
  }

  let sesion;

  try {
    sesion =
      JSON.parse(valor);
  } catch (error) {
    cache.remove(
      claveSesion
    );

    throw crearErrorAplicacion(
      'SESION_INVALIDA',
      'La sesión no es válida. Inicie sesión nuevamente.'
    );
  }

  const fechaExpiracion =
    new Date(
      sesion.fechaExpiracion
    ).getTime();

  if (
    !Number.isFinite(
      fechaExpiracion
    ) ||
    fechaExpiracion <=
      Date.now()
  ) {
    cerrarSesion(
      tokenLimpio
    );

    throw crearErrorAplicacion(
      'SESION_EXPIRADA',
      'La sesión expiró. Inicie sesión nuevamente.'
    );
  }

  validarRolActivo(
    sesion.rol
  );

  return sesion;
}

/**
 * Valida que el rol actual tenga un permiso.
 *
 * IMPORTANTE:
 * El permiso se consulta desde PermisosRol.
 * No se confía únicamente en la lista almacenada
 * cuando se creó la sesión.
 */
function validarPermiso(
  token,
  permisoRequerido
) {
  const sesion =
    obtenerSesion(token);

  const permiso =
    normalizarPermiso(
      permisoRequerido
    );

  if (!permiso) {
    throw crearErrorAplicacion(
      'PERMISO_REQUERIDO',
      'No se indicó el permiso requerido.'
    );
  }

  const permisosActuales =
    obtenerPermisosPorRol(
      sesion.rol
    );

  if (
    !permisosActuales.includes(
      permiso
    )
  ) {
    throw crearErrorAplicacion(
      'PERMISO_DENEGADO',
      'No tiene permisos para realizar esta acción.'
    );
  }

  /*
   * Se devuelve la sesión con los permisos actuales.
   */
  return Object.assign(
    {},
    sesion,
    {
      permisos:
        permisosActuales
    }
  );
}

/**
 * Cierra una sesión.
 */
function cerrarSesion(token) {
  const tokenLimpio =
    String(
      token || ''
    ).trim();

  if (!tokenLimpio) {
    return {
      cerrada: true
    };
  }

  const cache =
    CacheService.getScriptCache();

  const claveSesion =
    construirClaveSesion(
      tokenLimpio
    );

  let sesion = null;

  const valor =
    cache.get(
      claveSesion
    );

  if (valor) {
    try {
      sesion =
        JSON.parse(valor);
    } catch (error) {
      sesion = null;
    }
  }

  cache.remove(
    claveSesion
  );

  if (sesion) {
    registrarAuditoria({
      usuario:
        sesion.usuario,

      nombre:
        sesion.nombre,

      accion:
        'CERRAR_SESION',

      entidad:
        'Seguridad',

      idRegistro:
        '',

      detalle:
        'Cierre de sesión'
    });
  }

  return {
    cerrada: true
  };
}

/**
 * Devuelve información actualizada de la sesión.
 */
function consultarSesion(token) {
  const sesion =
    obtenerSesion(token);

  const permisosActuales =
    obtenerPermisosPorRol(
      sesion.rol
    );

  const fechaExpiracion =
    new Date(
      sesion.fechaExpiracion
    ).getTime();

  const segundosRestantes =
    Math.max(
      0,
      Math.floor(
        (
          fechaExpiracion -
          Date.now()
        ) / 1000
      )
    );

  return {
    usuario:
      sesion.usuario,

    nombre:
      sesion.nombre,

    rol:
      sesion.rol,

    permisos:
      permisosActuales,

    fechaInicio:
      sesion.fechaInicio,

    fechaExpiracion:
      sesion.fechaExpiracion,

    duracionSesionSegundos:
      sesion.duracionSesionSegundos,

    segundosRestantes:
      segundosRestantes
  };
}

/**
 * Construye la clave usada en CacheService.
 */
function construirClaveSesion(token) {
  return 'SESION_' + token;
}

/**
 * Prueba un permiso.
 */
function probarPermisoRegistrarCaminante() {
  const token =
    'REEMPLAZAR_POR_TOKEN_REAL';

  const sesion =
    validarPermiso(
      token,
      'REGISTRAR_CAMINANTE'
    );

  console.log(
    JSON.stringify(
      sesion,
      null,
      2
    )
  );
}
