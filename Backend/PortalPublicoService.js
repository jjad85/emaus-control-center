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
      'Gracias por registrarte. El equipo organizador revisará tu información.',

    autorizacionDatosTitulo:
      configuracion.portalAutorizacionDatosTitulo ||
      'Autorización para el tratamiento de datos personales',

    autorizacionDatosTextoHtml:
      configuracion.portalAutorizacionDatosTextoHtml ||
      '',

    autorizacionDatosVersion:
      configuracion.portalAutorizacionDatosVersion ||
      '1.0',

    autorizacionDatosTextoAceptacion:
      configuracion.portalAutorizacionDatosTextoAceptacion ||
      'He leído y acepto la autorización para el tratamiento de mis datos personales.',

    autorizacionFotosTitulo:
      configuracion.portalAutorizacionFotosTitulo ||
      'Autorización de fotografías y material audiovisual',

    autorizacionFotosTextoHtml:
      configuracion.portalAutorizacionFotosTextoHtml ||
      '',

    autorizacionFotosVersion:
      configuracion.portalAutorizacionFotosVersion ||
      '1.0',

    autorizacionFotosTextoAceptacion:
      configuracion.portalAutorizacionFotosTextoAceptacion ||
      'Autorizo el uso de fotografías y material audiovisual conforme al texto informado.'
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
