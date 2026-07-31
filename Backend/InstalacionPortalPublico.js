/**
 * Agrega las configuraciones faltantes del portal público.
 *
 * No modifica ni elimina valores que ya existan.
 * Ejecutar manualmente una sola vez desde Apps Script.
 */
function instalarConfiguracionesPortalPublico() {
  const hoja =
    obtenerHoja(
      HOJAS.CONFIGURACIONES
    );

  const existentes =
    leerHojaComoObjetos(
      HOJAS.CONFIGURACIONES
    );

  const configuraciones = [
    [
      'portalTitulo',
      'Retiro de Emaús',
      'Texto',
      'Título principal del portal público',
      'Sí'
    ],
    [
      'portalSubtitulo',
      'Un espacio para detenernos, encontrarnos y comenzar de nuevo.',
      'Texto',
      'Subtítulo del portal público',
      'Sí'
    ],
    [
      'portalContenidoHtml',
      '',
      'HTML',
      'Contenido HTML mostrado en la página inicial',
      'Sí'
    ],
    [
      'portalMostrarRetiro',
      'Sí',
      'Booleano',
      'Muestra u oculta toda la información del próximo retiro en el portal',
      'Sí'
    ],
    [
      'portalFechaInicioRetiro',
      '2026-09-11',
      'Fecha',
      'Fecha inicial del próximo retiro en formato AAAA-MM-DD',
      'Sí'
    ],
    [
      'portalFechaFinRetiro',
      '2026-09-13',
      'Fecha',
      'Fecha final del próximo retiro en formato AAAA-MM-DD',
      'Sí'
    ],
    [
      'portalDiasRetiro',
      '11 · 12 · 13',
      'Texto',
      'Días mostrados en la tarjeta del próximo retiro',
      'Sí'
    ],
    [
      'portalMesAnioRetiro',
      'Septiembre de 2026',
      'Texto',
      'Mes y año mostrados en la tarjeta del próximo retiro',
      'Sí'
    ],
    [
      'portalLugarRetiro',
      'Parroquia Santa Teresita del Niño Jesús',
      'Texto',
      'Lugar mostrado para el próximo retiro',
      'Sí'
    ],
    [
      'portalInscripcionesAbiertas',
      'Sí',
      'Booleano',
      'Abre o cierra las inscripciones públicas',
      'Sí'
    ],
    [
      'portalHayCupos',
      'Sí',
      'Booleano',
      'Indica si todavía existen cupos disponibles',
      'Sí'
    ],
    [
      'portalRegistroActivo',
      'Sí',
      'Booleano',
      'Compatibilidad con versiones anteriores; usar portalInscripcionesAbiertas',
      'Sí'
    ],
    [
      'portalMensajeRegistroCerrado',
      'Las inscripciones se encuentran cerradas.',
      'Texto',
      'Mensaje cuando el registro está cerrado',
      'Sí'
    ],
    [
      'portalTextoBotonRegistro',
      'Registrarme al retiro',
      'Texto',
      'Texto del botón de registro',
      'Sí'
    ],
    [
      'portalMensajeSinCupos',
      'Cupos agotados',
      'Texto',
      'Mensaje mostrado cuando ya no existen cupos',
      'Sí'
    ],
    [
      'portalMensajeSinRetiro',
      'Próximamente anunciaremos un nuevo retiro.',
      'Texto',
      'Mensaje utilizado cuando no hay un retiro publicado',
      'Sí'
    ],
    [
      'portalMostrarReportePago',
      'Sí',
      'Booleano',
      'Muestra u oculta el acceso público para reportar pagos',
      'Sí'
    ],
    [
      'portalTextoBotonReportePago',
      'Reportar pago',
      'Texto',
      'Texto del botón de reporte de pago',
      'Sí'
    ],
    [
      'portalUrlRegistro',
      '/registro',
      'Texto',
      'Ruta o URL de inscripción',
      'Sí'
    ],
    [
      'portalUrlReportePago',
      '/reportar-pago',
      'Texto',
      'Ruta o URL para reportar pagos',
      'Sí'
    ],
    [
      'portalTextoBotonLogin',
      'Ingresar al centro de control',
      'Texto',
      'Texto del botón de acceso',
      'Sí'
    ],
    [
      'portalPagoMensajeReporte',
      'Esta página es únicamente para reportar un pago ya realizado. El pago debe efectuarse mediante transferencia bancaria.',
      'Texto',
      'Mensaje informativo mostrado en la página pública de reporte de pago',
      'Sí'
    ],
    [
      'portalPagoBanco',
      'Bancolombia',
      'Texto',
      'Banco receptor de los pagos del retiro',
      'Sí'
    ],
    [
      'portalPagoTipoCuenta',
      'Ahorros',
      'Texto',
      'Tipo de cuenta bancaria para los pagos del retiro',
      'Sí'
    ],
    [
      'portalPagoNumeroCuenta',
      '004-000028-62',
      'Texto',
      'Número de cuenta bancaria para los pagos del retiro',
      'Sí'
    ],
    [
      'portalPagoNombreTitular',
      'Parroquia de Santa Teresita del Niño Jesús',
      'Texto',
      'Nombre del titular de la cuenta bancaria',
      'Sí'
    ],
    [
      'portalMensajeConfirmacion',
      'Gracias por registrarte. El equipo organizador revisará tu información.',
      'Texto',
      'Mensaje posterior al registro',
      'Sí'
    ]
  ];

  const nuevas =
    configuraciones.filter(
      function(configuracion) {
        return !existentes.some(
          function(actual) {
            return (
              normalizarTexto(
                actual.clave
              ) ===
              normalizarTexto(
                configuracion[0]
              )
            );
          }
        );
      }
    );

  if (nuevas.length > 0) {
    hoja
      .getRange(
        hoja.getLastRow() + 1,
        1,
        nuevas.length,
        5
      )
      .setValues(
        nuevas
      );
  }

  limpiarCacheConfiguracionesPortal();

  return {
    configuracionesAgregadas:
      nuevas.length,
    mensaje:
      nuevas.length > 0
        ? 'Configuraciones del portal agregadas correctamente.'
        : 'Las configuraciones del portal ya existían.'
  };
}

/**
 * Limpia la caché para reflejar inmediatamente los cambios.
 */
function limpiarCacheConfiguracionesPortal() {
  CacheService
    .getScriptCache()
    .remove(
      CLAVE_CACHE_CONFIGURACIONES
    );
}
