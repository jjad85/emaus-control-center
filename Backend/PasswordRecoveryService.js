/**
 * ============================================================
 * RECUPERACIÓN DE CONTRASEÑA POR CORREO
 * ============================================================
 */

const RECUPERACION_MINUTOS_VIGENCIA = 15;
const RECUPERACION_MAX_INTENTOS = 5;
const RECUPERACION_MAX_SOLICITUDES_HORA = 3;

function solicitarRecuperacionClave(
  usuarioIngresado,
  correoIngresado
) {
  const usuarioNormalizado =
    normalizarTexto(
      usuarioIngresado
    );

  const correo =
    normalizarCorreoUsuario(
      correoIngresado
    );

  if (!usuarioNormalizado) {
    throw crearErrorAplicacion(
      'USUARIO_REQUERIDO',
      'Debe ingresar el usuario.'
    );
  }

  if (!correo) {
    throw crearErrorAplicacion(
      'CORREO_REQUERIDO',
      'Debe ingresar el correo electrónico.'
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      correo
    )
  ) {
    throw crearErrorAplicacion(
      'CORREO_INVALIDO',
      'Ingrese un correo electrónico válido.'
    );
  }

  const usuario =
    buscarUsuarioPorUsuario(
      usuarioIngresado
    );

  const usuarioYCorreoCoinciden =
    usuario &&
    convertirBooleano(
      usuario.activo
    ) &&
    normalizarTexto(
      usuario.usuario
    ) ===
      usuarioNormalizado &&
    normalizarCorreoUsuario(
      usuario.correo
    ) ===
      correo;

  if (!usuarioYCorreoCoinciden) {
    Utilities.sleep(350);

    throw crearErrorAplicacion(
      'USUARIO_CORREO_NO_REGISTRADO',
      'Usuario y/o correo no registrado.'
    );
  }

  const respuestaExitosa = {
    enviado: true,
    mensaje:
      'Código enviado al correo registrado.'
  };

  validarLimiteSolicitudesRecuperacion(
    usuario.id ||
      usuario.usuario
  );

  invalidarRecuperacionesAnteriores(
    usuario.id ||
      usuario.usuario
  );

  const codigo =
    generarCodigoRecuperacion();

  const salt =
    Utilities.getUuid();

  const codigoHash =
    generarHashPassword(
      codigo,
      salt
    );

  const ahora =
    new Date();

  const vencimiento =
    new Date(
      ahora.getTime() +
        RECUPERACION_MINUTOS_VIGENCIA *
          60 *
          1000
    );

  const id =
    Utilities.getUuid();

  const hoja =
    obtenerHoja(
      HOJAS.RECUPERACIONES_CLAVE
    );

  hoja.appendRow([
    id,
    usuario.id || '',
    usuario.usuario,
    correo,
    salt,
    codigoHash,
    ahora,
    vencimiento,
    'Pendiente',
    0,
    '',
    ''
  ]);

  enviarCorreoRecuperacion({
    correo: correo,
    nombre:
      usuario.nombre ||
      usuario.usuario,
    codigo: codigo,
    minutos:
      RECUPERACION_MINUTOS_VIGENCIA
  });

  registrarAuditoria({
    usuario:
      usuario.usuario,

    nombre:
      usuario.nombre,

    accion:
      'SOLICITAR_RECUPERACION_CLAVE',

    entidad:
      'Seguridad',

    idRegistro:
      usuario.id,

    detalle:
      'Se envió un código de recuperación al correo registrado.'
  });

  return respuestaExitosa;
}

function restablecerClaveConCodigo(
  usuarioIngresado,
  correoIngresado,
  codigoIngresado,
  nuevaClave
) {
  const usuarioNormalizado =
    normalizarTexto(
      usuarioIngresado
    );

  const correo =
    normalizarCorreoUsuario(
      correoIngresado
    );

  const codigo =
    String(
      codigoIngresado || ''
    ).replace(/\D/g, '');

  if (
    !usuarioNormalizado ||
    !correo ||
    !codigo ||
    !nuevaClave
  ) {
    throw crearErrorAplicacion(
      'DATOS_RECUPERACION_REQUERIDOS',
      'Complete usuario, correo, código y nueva contraseña.'
    );
  }

  if (!/^\d{6}$/.test(codigo)) {
    throw crearErrorAplicacion(
      'CODIGO_INVALIDO',
      'El código debe tener 6 dígitos.'
    );
  }

  validarPoliticaPassword(
    nuevaClave
  );

  const usuario =
    buscarUsuarioPorUsuario(
      usuarioIngresado
    );

  const usuarioYCorreoCoinciden =
    usuario &&
    convertirBooleano(
      usuario.activo
    ) &&
    normalizarTexto(
      usuario.usuario
    ) ===
      usuarioNormalizado &&
    normalizarCorreoUsuario(
      usuario.correo
    ) ===
      correo;

  if (!usuarioYCorreoCoinciden) {
    throw crearErrorAplicacion(
      'USUARIO_CORREO_NO_REGISTRADO',
      'Usuario y/o correo no registrado.'
    );
  }

  const recuperacion =
    obtenerRecuperacionVigente(
      usuario.id ||
        usuario.usuario
    );

  if (!recuperacion) {
    throw crearErrorAplicacion(
      'CODIGO_INVALIDO',
      'El código es incorrecto o venció.'
    );
  }

  if (
    Number(recuperacion.intentos) >=
      RECUPERACION_MAX_INTENTOS
  ) {
    marcarRecuperacion(
      recuperacion.numeroFila,
      'Bloqueado',
      'Máximo de intentos superado'
    );

    throw crearErrorAplicacion(
      'RECUPERACION_BLOQUEADA',
      'El código fue bloqueado. Solicite uno nuevo.'
    );
  }

  const codigoValido =
    validarPassword(
      codigo,
      recuperacion.salt,
      recuperacion.codigoHash
    );

  if (!codigoValido) {
    incrementarIntentosRecuperacion(
      recuperacion.numeroFila,
      Number(
        recuperacion.intentos || 0
      ) + 1
    );

    throw crearErrorAplicacion(
      'CODIGO_INVALIDO',
      'El código es incorrecto o venció.'
    );
  }

  const resultado =
    actualizarPasswordUsuario(
      usuario.usuario,
      nuevaClave
    );

  marcarRecuperacion(
    recuperacion.numeroFila,
    'Usado',
    'Contraseña restablecida'
  );

  invalidarRecuperacionesAnteriores(
    usuario.id ||
      usuario.usuario,
    recuperacion.id
  );

  registrarAuditoria({
    usuario:
      usuario.usuario,

    nombre:
      usuario.nombre,

    accion:
      'RESTABLECER_CLAVE',

    entidad:
      'Seguridad',

    idRegistro:
      usuario.id,

    detalle:
      'Contraseña restablecida mediante código enviado por correo. Sesiones anteriores revocadas.'
  });

  return {
    restablecida: true,
    usuario:
      resultado.usuario
  };
}

function generarCodigoRecuperacion() {
  const bytes =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      [
        Utilities.getUuid(),
        Utilities.getUuid(),
        new Date().getTime(),
        Math.random()
      ].join(':'),
      Utilities.Charset.UTF_8
    );

  let numero = 0;

  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {
    numero =
      (
        numero * 31 +
        (bytes[i] & 255)
      ) % 1000000;
  }

  return String(numero)
    .padStart(6, '0');
}

function enviarCorreoRecuperacion(
  datos
) {
  const nombreSistema =
    obtenerConfiguracion(
      'sistemaNombre',
      'Centro de Control EMAÚS'
    );

  const asunto =
    'Código para recuperar tu contraseña';

  const texto = [
    'Hola, ' + datos.nombre + '.',
    '',
    'Recibimos una solicitud para recuperar tu acceso a ' +
      nombreSistema +
      '.',
    '',
    'Tu código de verificación es:',
    '',
    datos.codigo,
    '',
    'Este código vence en ' +
      datos.minutos +
      ' minutos y solo puede utilizarse una vez.',
    '',
    'Si no solicitaste este cambio, ignora este mensaje. Tu contraseña no ha sido modificada.'
  ].join('\n');

  const html =
    '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#202124">' +
      '<h2 style="margin-bottom:8px">' +
        escaparHtmlRecuperacion(
          nombreSistema
        ) +
      '</h2>' +
      '<p>Hola, <strong>' +
        escaparHtmlRecuperacion(
          datos.nombre
        ) +
      '</strong>.</p>' +
      '<p>Recibimos una solicitud para recuperar tu acceso.</p>' +
      '<div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:18px 20px;background:#f3f4f6;border-radius:10px;text-align:center;margin:22px 0">' +
        datos.codigo +
      '</div>' +
      '<p>El código vence en <strong>' +
        datos.minutos +
      ' minutos</strong> y solo puede utilizarse una vez.</p>' +
      '<p style="color:#5f6368">Si no solicitaste este cambio, ignora el mensaje. Tu contraseña no ha sido modificada.</p>' +
    '</div>';

  MailApp.sendEmail({
    to:
      datos.correo,

    subject:
      asunto,

    body:
      texto,

    htmlBody:
      html,

    name:
      nombreSistema
  });
}

function validarLimiteSolicitudesRecuperacion(
  usuarioId
) {
  const hoja =
    obtenerHoja(
      HOJAS.RECUPERACIONES_CLAVE
    );

  const datos =
    hoja.getDataRange()
      .getValues();

  if (datos.length < 2) {
    return;
  }

  const limite =
    Date.now() -
    60 * 60 * 1000;

  const total =
    datos.slice(1)
      .filter(function(fila) {
        const fecha =
          new Date(
            fila[6]
          ).getTime();

        return (
          String(fila[1] || fila[2]) ===
            String(usuarioId) &&
          Number.isFinite(fecha) &&
          fecha >= limite
        );
      })
      .length;

  if (
    total >=
    RECUPERACION_MAX_SOLICITUDES_HORA
  ) {
    throw crearErrorAplicacion(
      'LIMITE_RECUPERACION',
      'Se alcanzó el límite de solicitudes. Intente nuevamente más tarde.'
    );
  }
}

function obtenerRecuperacionVigente(
  usuarioId
) {
  const hoja =
    obtenerHoja(
      HOJAS.RECUPERACIONES_CLAVE
    );

  /*
   * IMPORTANTE:
   * Se usan valores reales y no getDisplayValues().
   * getDisplayValues() devuelve fechas formateadas según la región
   * de la hoja, por ejemplo 18/07/2026 10:30:00, y JavaScript puede
   * interpretarlas como fecha inválida. Eso hacía que un código recién
   * creado apareciera inmediatamente como vencido.
   */
  const datos =
    hoja.getDataRange()
      .getValues();

  for (
    let i = datos.length - 1;
    i >= 1;
    i--
  ) {
    const fila =
      datos[i];

    const mismoUsuario =
      String(
        fila[1] || fila[2]
      ) ===
      String(usuarioId);

    const pendiente =
      normalizarTexto(
        fila[8]
      ) ===
      'pendiente';

    const valorVencimiento =
      fila[7];

    const vencimiento =
      valorVencimiento instanceof Date
        ? valorVencimiento.getTime()
        : new Date(
            valorVencimiento
          ).getTime();

    if (
      mismoUsuario &&
      pendiente &&
      Number.isFinite(vencimiento) &&
      vencimiento > Date.now()
    ) {
      return {
        id: fila[0],
        salt: fila[4],
        codigoHash: fila[5],
        intentos:
          Number(fila[9] || 0),
        numeroFila:
          i + 1
      };
    }
  }

  return null;
}

function incrementarIntentosRecuperacion(
  numeroFila,
  intentos
) {
  const hoja =
    obtenerHoja(
      HOJAS.RECUPERACIONES_CLAVE
    );

  hoja.getRange(
    numeroFila,
    10
  ).setValue(
    intentos
  );

  if (
    intentos >=
    RECUPERACION_MAX_INTENTOS
  ) {
    marcarRecuperacion(
      numeroFila,
      'Bloqueado',
      'Máximo de intentos superado'
    );
  }
}

function marcarRecuperacion(
  numeroFila,
  estado,
  observacion
) {
  const hoja =
    obtenerHoja(
      HOJAS.RECUPERACIONES_CLAVE
    );

  hoja.getRange(
    numeroFila,
    9
  ).setValue(
    estado
  );

  hoja.getRange(
    numeroFila,
    11
  ).setValue(
    new Date()
  );

  hoja.getRange(
    numeroFila,
    12
  ).setValue(
    observacion || ''
  );
}

function invalidarRecuperacionesAnteriores(
  usuarioId,
  idExcluir
) {
  const hoja =
    obtenerHoja(
      HOJAS.RECUPERACIONES_CLAVE
    );

  const datos =
    hoja.getDataRange()
      .getDisplayValues();

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    const fila =
      datos[i];

    if (
      String(
        fila[1] || fila[2]
      ) ===
        String(usuarioId) &&
      normalizarTexto(
        fila[8]
      ) ===
        'pendiente' &&
      String(fila[0]) !==
        String(idExcluir || '')
    ) {
      marcarRecuperacion(
        i + 1,
        'Invalidado',
        'Se generó un código posterior'
      );
    }
  }
}

function escaparHtmlRecuperacion(
  valor
) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
