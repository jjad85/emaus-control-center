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
      'portalRegistroActivo',
      'Sí',
      'Booleano',
      'Permite abrir o cerrar el registro público',
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
      'portalTextoBotonLogin',
      'Ingresar al centro de control',
      'Texto',
      'Texto del botón de acceso',
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
