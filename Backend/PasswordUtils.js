/**
 * ============================================================
 * PASSWORD UTILS
 * ============================================================
 *
 * Manejo de contraseñas para Control Center Emaús.
 *
 * Se utiliza:
 * - Salt único por usuario
 * - HMAC SHA-256
 *
 * No se realizan miles de iteraciones porque Apps Script
 * se vuelve extremadamente lento y este sistema es privado.
 * ============================================================
 */

/**
 * Genera un salt aleatorio.
 */
function generarSaltPassword() {
  return Utilities.getUuid();
}

/**
 * Genera el hash de una contraseña.
 */
function generarHashPassword(
  password,
  salt
) {
  if (!password) {
    throw new Error(
      'La contraseña no puede estar vacía.'
    );
  }

  if (!salt) {
    throw new Error(
      'El salt no puede estar vacío.'
    );
  }

  const firma =
    Utilities.computeHmacSha256Signature(
      String(password),
      String(salt),
      Utilities.Charset.UTF_8
    );

  return Utilities.base64EncodeWebSafe(
    firma
  );
}

/**
 * Crea una credencial nueva.
 */
function crearCredencialPassword(
  password
) {
  const salt =
    generarSaltPassword();

  const hash =
    generarHashPassword(
      password,
      salt
    );

  return {
    salt: salt,
    claveHash: hash
  };
}

/**
 * Valida una contraseña.
 */
function validarPassword(
  passwordIngresado,
  salt,
  hashGuardado
) {
  const hashCalculado =
    generarHashPassword(
      passwordIngresado,
      salt
    );

  return comparacionSegura(
    hashCalculado,
    hashGuardado
  );
}

/**
 * Comparación segura.
 */
function comparacionSegura(
  valorA,
  valorB
) {
  const a =
    String(valorA || '');

  const b =
    String(valorB || '');

  if (a.length !== b.length) {
    return false;
  }

  let diferencia = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    diferencia |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }

  return diferencia === 0;
}

/**
 * Genera una credencial de ejemplo.
 *
 * Ejecuta esta función únicamente cuando
 * quieras crear un nuevo usuario.
 */
function generarCredencialDePrueba() {

  const password =
    'Agustin2024.';

  const credencial =
    crearCredencialPassword(
      password
    );

  Logger.log(
    JSON.stringify(
      credencial,
      null,
      2
    )
  );
}

/**
 * Prueba rápida de validación.
 */
function probarPasswordUtils() {

  const password =
    'Agustin2024.';

  const credencial =
    crearCredencialPassword(
      password
    );

  const valido =
    validarPassword(
      password,
      credencial.salt,
      credencial.claveHash
    );

  Logger.log(
    JSON.stringify(
      credencial,
      null,
      2
    )
  );

  Logger.log(
    'Password válida: ' +
      valido
  );
}

/**
 * Valida la política mínima de contraseñas.
 */
function validarPoliticaPassword(
  password
) {
  const clave =
    String(password || '');

  if (clave.length < 10) {
    throw crearErrorAplicacion(
      'PASSWORD_DEBIL',
      'La contraseña debe tener mínimo 10 caracteres.'
    );
  }

  if (!/[a-z]/.test(clave)) {
    throw crearErrorAplicacion(
      'PASSWORD_DEBIL',
      'La contraseña debe incluir al menos una letra minúscula.'
    );
  }

  if (!/[A-Z]/.test(clave)) {
    throw crearErrorAplicacion(
      'PASSWORD_DEBIL',
      'La contraseña debe incluir al menos una letra mayúscula.'
    );
  }

  if (!/\d/.test(clave)) {
    throw crearErrorAplicacion(
      'PASSWORD_DEBIL',
      'La contraseña debe incluir al menos un número.'
    );
  }

  if (!/[^A-Za-z0-9]/.test(clave)) {
    throw crearErrorAplicacion(
      'PASSWORD_DEBIL',
      'La contraseña debe incluir al menos un símbolo.'
    );
  }

  const normalizada =
    normalizarTexto(clave);

  const prohibidas = [
    '1234567890',
    'password',
    'contrasena',
    'administrador',
    'emaus2026'
  ];

  if (
    prohibidas.some(function(item) {
      return normalizada.includes(item);
    })
  ) {
    throw crearErrorAplicacion(
      'PASSWORD_DEBIL',
      'La contraseña es demasiado predecible.'
    );
  }

  return true;
}

/**
 * Genera salt y claveHash para un cargue masivo de usuarios.
 *
 * Entrada esperada:
 * [
 *   { usuario: 'correo1@dominio.com', password: 'ClaveSegura1!' },
 *   { usuario: 'correo2@dominio.com', password: 'ClaveSegura2!' }
 * ]
 *
 * La contraseña en texto plano NO se incluye en el resultado ni se registra
 * en los logs. El resultado conserva el mismo algoritmo usado por el login:
 * salt único + HMAC SHA-256 + Base64 Web Safe.
 */
function generarCredencialesMasivas(usuarios) {
  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    throw new Error(
      'Debe enviar una lista con al menos un usuario y su contraseña.'
    );
  }

  const usuariosProcesados = {};

  return usuarios.map(function(item, indice) {
    const numeroFila = indice + 1;
    const usuario = String(
      item && (item.usuario || item.correo || item.email) || ''
    ).trim().toLowerCase();
    const password = String(
      item && (item.password || item.clave || item.contrasena) || ''
    );

    if (!usuario) {
      throw new Error(
        'El registro ' + numeroFila + ' no tiene usuario o correo.'
      );
    }

    if (!password) {
      throw new Error(
        'El registro ' + numeroFila + ' (' + usuario + ') no tiene contraseña.'
      );
    }

    if (usuariosProcesados[usuario]) {
      throw new Error(
        'El usuario ' + usuario + ' está repetido en la lista.'
      );
    }

    validarPoliticaPassword(password);
    usuariosProcesados[usuario] = true;

    const credencial = crearCredencialPassword(password);

    return {
      usuario: usuario,
      salt: credencial.salt,
      claveHash: credencial.claveHash
    };
  });
}

/**
 * Función ejecutable desde el editor de Apps Script.
 *
 * 1. Reemplace los registros de ejemplo por los usuarios reales.
 * 2. Ejecute esta función.
 * 3. Copie el JSON del registro de ejecución.
 * 4. Elimine inmediatamente las contraseñas en texto plano del código.
 */
function ejecutarGeneracionCredencialesMasivas() {
  const usuarios = [
    {
      usuario: 'servidor1@ejemplo.com',
      password: 'Cambiar2026!'
    },
    {
      usuario: 'servidor2@ejemplo.com',
      password: 'Cambiar2026!'
    }
  ];

  const resultado = generarCredencialesMasivas(usuarios);

  Logger.log(
    JSON.stringify(resultado, null, 2)
  );

  return resultado;
}

/**
 * Convierte el resultado de generarCredencialesMasivas a una matriz que se
 * puede pegar directamente en Google Sheets: Usuario | Salt | ClaveHash.
 */
function generarMatrizCredencialesMasivas(usuarios) {
  const credenciales = generarCredencialesMasivas(usuarios);

  return [
    ['Usuario', 'Salt', 'ClaveHash']
  ].concat(
    credenciales.map(function(item) {
      return [
        item.usuario,
        item.salt,
        item.claveHash
      ];
    })
  );
}
