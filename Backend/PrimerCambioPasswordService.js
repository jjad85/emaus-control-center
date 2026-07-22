/**
 * ============================================================
 * PRIMER CAMBIO DE CONTRASEÑA SERVICE
 * ============================================================
 *
 * Obliga al usuario a cambiar la contraseña únicamente cuando
 * Usuarios.Debe Cambiar Password está marcado como verdadero.
 */

function cambiarPrimerPassword(
  token,
  passwordActual,
  passwordNueva
) {
  const sesion = obtenerSesion(token);

  if (
    !convertirBooleano(
      sesion.debeCambiarPassword
    )
  ) {
    throw crearErrorAplicacion(
      'CAMBIO_PASSWORD_NO_REQUERIDO',
      'Este usuario ya realizó el cambio inicial de contraseña.'
    );
  }

  const actual = String(
    passwordActual || ''
  );

  const nueva = String(
    passwordNueva || ''
  );

  if (!actual || !nueva) {
    throw crearErrorAplicacion(
      'PASSWORD_REQUERIDA',
      'Ingrese la contraseña actual y la nueva contraseña.'
    );
  }

  const usuario =
    buscarUsuarioPorUsuario(
      sesion.usuario
    );

  if (!usuario) {
    throw crearErrorAplicacion(
      'USUARIO_NO_ENCONTRADO',
      'No existe el usuario asociado a la sesión.'
    );
  }

  if (
    !convertirBooleano(
      usuario.debeCambiarPassword
    )
  ) {
    sesion.debeCambiarPassword = false;
    actualizarSesionPrimerCambio_(
      token,
      sesion
    );

    throw crearErrorAplicacion(
      'CAMBIO_PASSWORD_NO_REQUERIDO',
      'Este usuario ya realizó el cambio inicial de contraseña.'
    );
  }

  if (
    !validarPassword(
      actual,
      usuario.salt,
      usuario.claveHash
    )
  ) {
    throw crearErrorAplicacion(
      'PASSWORD_ACTUAL_INVALIDA',
      'La contraseña actual no es correcta.'
    );
  }

  if (actual === nueva) {
    throw crearErrorAplicacion(
      'PASSWORD_SIN_CAMBIOS',
      'La nueva contraseña debe ser diferente de la contraseña actual.'
    );
  }

  validarPoliticaPassword(
    nueva
  );

  const credencial =
    crearCredencialPassword(
      nueva
    );

  actualizarSeguridadUsuario_(
    usuario.usuario,
    {
      salt:
        credencial.salt,
      claveHash:
        credencial.claveHash,
      debeCambiarPassword:
        false,
      intentosFallidos:
        0,
      ultimoIntentoFallido:
        '',
      bloqueadoHasta:
        ''
    }
  );

  sesion.debeCambiarPassword = false;

  actualizarSesionPrimerCambio_(
    token,
    sesion
  );

  registrarAuditoria({
    usuario:
      usuario.usuario,
    nombre:
      usuario.nombre,
    accion:
      'CAMBIAR_PASSWORD_INICIAL',
    entidad:
      'Seguridad',
    idRegistro:
      usuario.id,
    detalle:
      'El usuario realizó correctamente el cambio inicial de contraseña.'
  });

  return {
    actualizado: true,
    debeCambiarPassword: false
  };
}

function actualizarSesionPrimerCambio_(
  token,
  sesion
) {
  const fechaExpiracion =
    new Date(
      sesion.fechaExpiracion
    ).getTime();

  const segundosRestantes =
    Math.max(
      1,
      Math.floor(
        (
          fechaExpiracion -
          Date.now()
        ) / 1000
      )
    );

  guardarSesion(
    token,
    sesion,
    segundosRestantes
  );
}
