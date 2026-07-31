/**
 * ============================================================
 * PORTAL PÚBLICO SERVICE
 * Entrega 6.1.4 - Portal parametrizable
 * ============================================================
 */
function obtenerPortalPublico() {
  const configuracion = obtenerConfiguraciones();

  const mostrarRetiro = obtenerBooleanoPortal(
    configuracion.portalMostrarRetiro,
    true
  );

  const inscripcionesAbiertas = obtenerBooleanoPortal(
    configuracion.portalInscripcionesAbiertas !== undefined
      ? configuracion.portalInscripcionesAbiertas
      : configuracion.portalRegistroActivo,
    true
  );

  const hayCupos = obtenerBooleanoPortal(
    configuracion.portalHayCupos,
    true
  );

  const registroActivo = mostrarRetiro && inscripcionesAbiertas && hayCupos;
  const textoEstadoRegistro = !mostrarRetiro
    ? (configuracion.portalMensajeSinRetiro || 'Próximamente anunciaremos un nuevo retiro.')
    : !hayCupos
      ? (configuracion.portalMensajeSinCupos || 'Cupos agotados')
      : !inscripcionesAbiertas
        ? (configuracion.portalMensajeRegistroCerrado || 'Inscripciones cerradas')
        : '';

  return {
    titulo: configuracion.portalTitulo || configuracion.titulo || 'Retiro de Emaús',
    subtitulo: configuracion.portalSubtitulo || configuracion.subtitulo || 'Un espacio para detenernos, encontrarnos y comenzar de nuevo.',
    contenidoHtml: configuracion.portalContenidoHtml || configuracion.contenidoHtml || '',

    mostrarRetiro: mostrarRetiro,
    fechaInicioRetiro: configuracion.portalFechaInicioRetiro || '',
    fechaFinRetiro: configuracion.portalFechaFinRetiro || '',
    diasRetiro: configuracion.portalDiasRetiro || '11 · 12 · 13',
    mesAnioRetiro: configuracion.portalMesAnioRetiro || 'Septiembre de 2026',
    lugarRetiro: configuracion.portalLugarRetiro || 'Parroquia Santa Teresita del Niño Jesús',

    inscripcionesAbiertas: inscripcionesAbiertas,
    hayCupos: hayCupos,
    registroActivo: registroActivo,
    textoEstadoRegistro: textoEstadoRegistro,
    mensajeRegistroCerrado: textoEstadoRegistro || configuracion.portalMensajeRegistroCerrado || 'Las inscripciones se encuentran cerradas.',
    mensajeSinCupos: configuracion.portalMensajeSinCupos || 'Cupos agotados',
    mensajeSinRetiro: configuracion.portalMensajeSinRetiro || 'Próximamente anunciaremos un nuevo retiro.',

    mostrarReportePago: obtenerBooleanoPortal(configuracion.portalMostrarReportePago, true),
    textoBotonRegistro: configuracion.portalTextoBotonRegistro || 'Registrarme al retiro',
    textoBotonReportePago: configuracion.portalTextoBotonReportePago || 'Reportar pago',
    textoBotonLogin: configuracion.portalTextoBotonLogin || 'Ingresar al centro de control',
    urlRegistro: configuracion.portalUrlRegistro || '/registro',
    urlReportePago: configuracion.portalUrlReportePago || '/reportar-pago',

    portalPagoMensajeReporte: configuracion.portalPagoMensajeReporte || 'Esta página es únicamente para reportar un pago ya realizado. El pago debe efectuarse mediante transferencia bancaria.',
    portalPagoBanco: configuracion.portalPagoBanco || 'Bancolombia',
    portalPagoTipoCuenta: configuracion.portalPagoTipoCuenta || 'Ahorros',
    portalPagoNumeroCuenta: configuracion.portalPagoNumeroCuenta || '004-000028-62',
    portalPagoNombreTitular: configuracion.portalPagoNombreTitular || 'Parroquia de Santa Teresita del Niño Jesús',

    mensajeConfirmacion: configuracion.portalMensajeConfirmacion || 'Gracias por registrarte. El equipo organizador revisará tu información.',
    autorizacionDatosTitulo: configuracion.portalAutorizacionDatosTitulo || 'Autorización para el tratamiento de datos personales',
    autorizacionDatosTextoHtml: configuracion.portalAutorizacionDatosTextoHtml || '',
    autorizacionDatosVersion: configuracion.portalAutorizacionDatosVersion || '1.0',
    autorizacionDatosTextoAceptacion: configuracion.portalAutorizacionDatosTextoAceptacion || 'He leído y acepto la autorización para el tratamiento de mis datos personales.',
    autorizacionFotosTitulo: configuracion.portalAutorizacionFotosTitulo || 'Autorización de fotografías y material audiovisual',
    autorizacionFotosTextoHtml: configuracion.portalAutorizacionFotosTextoHtml || '',
    autorizacionFotosVersion: configuracion.portalAutorizacionFotosVersion || '1.0',
    autorizacionFotosTextoAceptacion: configuracion.portalAutorizacionFotosTextoAceptacion || 'Autorizo el uso de fotografías y material audiovisual conforme al texto informado.'
  };
}

function obtenerBooleanoPortal(valor, valorPredeterminado) {
  if (valor === undefined || valor === null || valor === '') {
    return valorPredeterminado;
  }
  return convertirBooleano(valor);
}
