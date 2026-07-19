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
const MAXIMO_INTENTOS_FALLIDOS =
  3;

const MINUTOS_BLOQUEO_USUARIO =
  30;

const MINUTOS_VENTANA_INTENTOS =
  30;


/**
 * Inicia sesión.
 *
 * Política:
 * - 3 intentos fallidos dentro de 30 minutos.
 * - Al tercer intento, bloqueo durante 30 minutos.
 * - Si pasan 30 minutos desde el último intento fallido,
 *   el contador se reinicia.
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

  const bloqueo =
    LockService.getScriptLock();

  try {
    bloqueo.waitLock(30000);

    const registro =
      buscarUsuarioPorUsuario(
        usuario
      );

    /*
     * Para usuarios inexistentes se conserva un mensaje genérico,
     * evitando confirmar si la cuenta existe.
     */
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

    validarYActualizarBloqueoExpirado_(
      registro
    );

    const bloqueoVigente =
      obtenerFechaUsuario_(
        registro.bloqueadoHasta
      );

    if (
      bloqueoVigente &&
      bloqueoVigente.getTime() >
        Date.now()
    ) {
      const minutosRestantes =
        Math.max(
          1,
          Math.ceil(
            (
              bloqueoVigente.getTime() -
              Date.now()
            ) /
            60000
          )
        );

      throw crearErrorAplicacion(
        'USUARIO_BLOQUEADO',
        'El usuario se encuentra bloqueado. Intente nuevamente en aproximadamente ' +
          minutosRestantes +
          (
            minutosRestantes === 1
              ? ' minuto.'
              : ' minutos.'
          )
      );
    }

    const passwordValido =
      validarPassword(
        clave,
        registro.salt,
        registro.claveHash
      );

    if (!passwordValido) {
      procesarIntentoFallidoLogin_(
        registro
      );
    }

    /*
     * Inicio correcto:
     * se limpian intentos y bloqueo.
     */
    reiniciarIntentosUsuario_(
      registro.usuario
    );

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
  } finally {
    if (bloqueo.hasLock()) {
      bloqueo.releaseLock();
    }
  }
}


/**
 * Registra un intento fallido y lanza el error correspondiente.
 */
function procesarIntentoFallidoLogin_(
  registro
) {
  const ahora =
    new Date();

  const ultimoIntento =
    obtenerFechaUsuario_(
      registro.ultimoIntentoFallido
    );

  const ventanaMilisegundos =
    MINUTOS_VENTANA_INTENTOS *
    60 *
    1000;

  const contadorAnterior =
    ultimoIntento &&
    (
      ahora.getTime() -
      ultimoIntento.getTime()
    ) <= ventanaMilisegundos
      ? Number(
          registro.intentosFallidos ||
          0
        )
      : 0;

  const intentos =
    contadorAnterior + 1;

  if (
    intentos >=
    MAXIMO_INTENTOS_FALLIDOS
  ) {
    const bloqueadoHasta =
      new Date(
        ahora.getTime() +
          MINUTOS_BLOQUEO_USUARIO *
            60 *
            1000
      );

    actualizarSeguridadUsuario_(
      registro.usuario,
      {
        intentosFallidos:
          intentos,
        ultimoIntentoFallido:
          ahora,
        bloqueadoHasta:
          bloqueadoHasta
      }
    );

    registrarAuditoria({
      usuario:
        registro.usuario,
      nombre:
        registro.nombre,
      accion:
        'BLOQUEAR_USUARIO_LOGIN',
      entidad:
        'Seguridad',
      idRegistro:
        registro.id,
      detalle:
        'Bloqueo automático por ' +
        MAXIMO_INTENTOS_FALLIDOS +
        ' intentos fallidos.'
    });

    throw crearErrorAplicacion(
      'USUARIO_BLOQUEADO',
      'El usuario quedó bloqueado durante ' +
        MINUTOS_BLOQUEO_USUARIO +
        ' minutos por superar el número permitido de intentos.'
    );
  }

  actualizarSeguridadUsuario_(
    registro.usuario,
    {
      intentosFallidos:
        intentos,
      ultimoIntentoFallido:
        ahora,
      bloqueadoHasta:
        ''
    }
  );

  if (
    intentos ===
    MAXIMO_INTENTOS_FALLIDOS - 1
  ) {
    throw crearErrorAplicacion(
      'ULTIMO_INTENTO_ANTES_BLOQUEO',
      'Contraseña incorrecta. Si vuelve a ingresar una contraseña incorrecta, el usuario será bloqueado durante ' +
        MINUTOS_BLOQUEO_USUARIO +
        ' minutos.'
    );
  }

  throw crearErrorAplicacion(
    'CREDENCIALES_INVALIDAS',
    'Usuario o contraseña incorrectos.'
  );
}


/**
 * Si el bloqueo ya venció, limpia el estado del usuario.
 */
function validarYActualizarBloqueoExpirado_(
  registro
) {
  const bloqueadoHasta =
    obtenerFechaUsuario_(
      registro.bloqueadoHasta
    );

  if (
    bloqueadoHasta &&
    bloqueadoHasta.getTime() <=
      Date.now()
  ) {
    reiniciarIntentosUsuario_(
      registro.usuario
    );

    registro.intentosFallidos = 0;
    registro.ultimoIntentoFallido = '';
    registro.bloqueadoHasta = '';
  }
}


/**
 * Convierte fechas de hoja o texto a Date.
 */
function obtenerFechaUsuario_(
  valor
) {
  if (!valor) {
    return null;
  }

  if (
    valor instanceof Date
  ) {
    return isNaN(
      valor.getTime()
    )
      ? null
      : valor;
  }

  const fecha =
    new Date(valor);

  return isNaN(
    fecha.getTime()
  )
    ? null
    : fecha;
}


/**
 * Reinicia los controles de intentos.
 */
function reiniciarIntentosUsuario_(
  usuario
) {
  actualizarSeguridadUsuario_(
    usuario,
    {
      intentosFallidos: 0,
      ultimoIntentoFallido: '',
      bloqueadoHasta: ''
    }
  );
}


/**
 * Actualiza campos de seguridad directamente en Usuarios.
 */
function actualizarSeguridadUsuario_(
  usuarioIngresado,
  cambios
) {
  const hoja =
    obtenerHoja(
      HOJAS.USUARIOS
    );

  const ultimaFila =
    hoja.getLastRow();

  const ultimaColumna =
    hoja.getLastColumn();

  const encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0];

  const normalizados =
    encabezados.map(
      normalizarEncabezadoSeguridad_
    );

  const indiceUsuario =
    normalizados.indexOf(
      'usuario'
    );

  if (indiceUsuario === -1) {
    throw crearErrorAplicacion(
      'COLUMNA_USUARIO',
      'No existe la columna Usuario.'
    );
  }

  const usuarios =
    hoja
      .getRange(
        2,
        indiceUsuario + 1,
        Math.max(
          0,
          ultimaFila - 1
        ),
        1
      )
      .getDisplayValues();

  let numeroFila = -1;

  for (
    let indice = 0;
    indice < usuarios.length;
    indice += 1
  ) {
    if (
      normalizarTexto(
        usuarios[indice][0]
      ) ===
      normalizarTexto(
        usuarioIngresado
      )
    ) {
      numeroFila =
        indice + 2;
      break;
    }
  }

  if (numeroFila === -1) {
    throw crearErrorAplicacion(
      'USUARIO_NO_ENCONTRADO',
      'No existe el usuario indicado.'
    );
  }

  Object.keys(
    cambios || {}
  ).forEach(
    function(propiedad) {
      const indiceColumna =
        normalizados.indexOf(
          normalizarEncabezadoSeguridad_(
            propiedad
          )
        );

      if (indiceColumna === -1) {
        throw crearErrorAplicacion(
          'COLUMNA_SEGURIDAD_FALTANTE',
          'Falta la columna de seguridad: ' +
            propiedad
        );
      }

      hoja
        .getRange(
          numeroFila,
          indiceColumna + 1
        )
        .setValue(
          cambios[propiedad]
        );
    }
  );
}


function normalizarEncabezadoSeguridad_(
  valor
) {
  return String(
    valor || ''
  )
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]/g,
      ''
    );
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
