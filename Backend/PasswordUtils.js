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