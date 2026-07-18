/**
 * ============================================================
 * PORTAL PÚBLICO SERVICE
 * ============================================================
 *
 * Construye la información pública de la página inicial
 * utilizando las configuraciones registradas en Google Sheets.
 */

function obtenerPortalPublico() {
  const configuracion =
    obtenerConfiguraciones();

  return {
    titulo:
      configuracion.portalTitulo ||
      configuracion.titulo ||
      'Retiro de Emaús',

    subtitulo:
      configuracion.portalSubtitulo ||
      configuracion.subtitulo ||
      'Un espacio para detenernos, encontrarnos y comenzar de nuevo.',

    contenidoHtml:
      configuracion.portalContenidoHtml ||
      configuracion.contenidoHtml ||
      '',

    registroActivo:
      obtenerBooleanoPortal(
        configuracion.portalRegistroActivo,
        true
      ),

    mensajeRegistroCerrado:
      configuracion.portalMensajeRegistroCerrado ||
      'Las inscripciones se encuentran cerradas.',

    textoBotonRegistro:
      configuracion.portalTextoBotonRegistro ||
      'Registrarme al retiro',

    textoBotonLogin:
      configuracion.portalTextoBotonLogin ||
      'Ingresar al centro de control',

    mensajeConfirmacion:
      configuracion.portalMensajeConfirmacion ||
      'Gracias por registrarte. El equipo organizador revisará tu información.'
  };
}

/**
 * Evita que una configuración ausente sea interpretada como false.
 */
function obtenerBooleanoPortal(
  valor,
  valorPredeterminado
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ''
  ) {
    return valorPredeterminado;
  }

  return convertirBooleano(
    valor
  );
}
