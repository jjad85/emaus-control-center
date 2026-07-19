/**
 * Instala el módulo gratuito de notificaciones por WhatsApp.
 * Ejecutar una sola vez desde Apps Script:
 *
 * instalarModuloWhatsappEmaus();
 */
function instalarModuloWhatsappEmaus() {
  const libro = obtenerLibro();

  instalarHojaNotificacionesWhatsapp_(libro);
  instalarConfiguracionesWhatsapp_(libro);
  instalarPermisosWhatsapp_(libro);

  limpiarCacheConfiguraciones();
  limpiarCachePermisos();

  sincronizarNotificacionesWhatsappPendientes_();

  SpreadsheetApp.flush();

  return {
    ok: true,
    mensaje: 'Módulo de WhatsApp instalado correctamente.'
  };
}

function instalarHojaNotificacionesWhatsapp_(libro) {
  const nombre = 'NotificacionesWhatsApp';
  let hoja = libro.getSheetByName(nombre);

  if (!hoja) {
    hoja = libro.insertSheet(nombre);
  }

  const encabezados = [
    'id',
    'tipo',
    'entidad',
    'entidadId',
    'nombre',
    'telefono',
    'motivo',
    'estado',
    'fechaCreacion',
    'fechaApertura',
    'fechaConfirmacion',
    'abiertoPor',
    'confirmadoPor',
    'activo'
  ];

  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, encabezados.length)
    .setFontWeight('bold')
    .setBackground('#173b34')
    .setFontColor('#ffffff');

  hoja.autoResizeColumns(1, encabezados.length);
}

function instalarConfiguracionesWhatsapp_(libro) {
  const hoja = libro.getSheetByName('Configuraciones');

  if (!hoja) {
    throw new Error('No existe la hoja Configuraciones.');
  }

  const filas = [
    [
      'whatsappCodigoPais',
      '57',
      'Texto',
      'Código de país usado para normalizar celulares de WhatsApp',
      'Sí'
    ],
    [
      'whatsappMensajeInscripcion',
      'Hola {{nombre}} 👋\n\nGracias por inscribirte al Retiro de Emaús {{tipoRetiro}} {{anioRetiro}}. Tu solicitud quedó registrada como aspirante y será revisada por nuestro equipo.\n\nJesucristo ha resucitado 🙏',
      'Texto',
      'Plantilla para confirmar la inscripción. Variables: {{nombre}}, {{numeroInscripcion}}, {{tipoRetiro}}, {{anioRetiro}}',
      'Sí'
    ],
    [
      'whatsappMensajeAprobacion',
      'Hola {{nombre}} 👋\n\nLuego de revisar tu inscripción, queremos contarte que has sido aceptado como caminante. Bienvenido a este camino de Emaús 🙏',
      'Texto',
      'Plantilla para notificar la aprobación. Variables: {{nombre}}, {{tipoRetiro}}, {{anioRetiro}}',
      'Sí'
    ],
    [
      'whatsappMensajeCancelacion',
      'Hola {{nombre}}.\n\nTe informamos que tu participación en el Retiro de Emaús fue cancelada.\n\nMotivo: {{motivo}}\n\nAgradecemos tu comprensión.',
      'Texto',
      'Plantilla para informar la cancelación. Variables: {{nombre}}, {{motivo}}, {{tipoRetiro}}, {{anioRetiro}}',
      'Sí'
    ]
  ];

  const datos = hoja.getDataRange().getValues();
  const claves = datos.slice(1).map(function(fila) {
    return String(fila[0] || '').trim();
  });

  filas.forEach(function(fila) {
    const posicion = claves.indexOf(fila[0]);

    if (posicion >= 0) {
      hoja.getRange(posicion + 2, 1, 1, fila.length).setValues([fila]);
    } else {
      hoja.appendRow(fila);
    }
  });
}

function instalarPermisosWhatsapp_(libro) {
  const hoja = libro.getSheetByName('PermisosRol');

  if (!hoja) {
    throw new Error('No existe la hoja PermisosRol.');
  }

  const filas = [
    ['Administrador', 'NOTIFICAR_ASPIRANTE', 'Sí'],
    ['Administrador', 'NOTIFICAR_CAMINANTE', 'Sí']
  ];

  const actuales = hoja.getDataRange().getValues();

  filas.forEach(function(nueva) {
    const existe = actuales.some(function(fila) {
      return (
        String(fila[0] || '').trim() === nueva[0] &&
        String(fila[1] || '').trim() === nueva[1]
      );
    });

    if (!existe) {
      hoja.appendRow(nueva);
    }
  });
}
