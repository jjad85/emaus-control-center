/**
 * Agrega el control de notificaciones omitidas sin borrar los datos existentes.
 *
 * Ejecutar una sola vez desde Apps Script:
 *
 * instalarControlNotificacionesWhatsapp();
 */
function instalarControlNotificacionesWhatsapp() {
  const libro = obtenerLibro();
  const nombreHoja = 'NotificacionesWhatsApp';
  const hoja = libro.getSheetByName(nombreHoja);

  if (!hoja) {
    throw new Error(
      'No existe la hoja NotificacionesWhatsApp. ' +
      'Primero ejecute instalarModuloWhatsappEmaus().'
    );
  }

  const requeridos = [
    'fechaOmitision',
    'omitidoPor',
    'motivoOmitision'
  ];

  let ultimaColumna = hoja.getLastColumn();
  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getValues()[0]
    .map(function(valor) {
      return String(valor || '').trim();
    });

  requeridos.forEach(function(encabezado) {
    if (encabezados.indexOf(encabezado) < 0) {
      ultimaColumna += 1;
      hoja.getRange(1, ultimaColumna).setValue(encabezado);
      encabezados.push(encabezado);
    }
  });

  hoja.getRange(1, 1, 1, hoja.getLastColumn())
    .setFontWeight('bold')
    .setBackground('#173b34')
    .setFontColor('#ffffff');

  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, hoja.getLastColumn());

  SpreadsheetApp.flush();

  return {
    ok: true,
    mensaje:
      'Control de notificaciones enviadas y omitidas instalado correctamente.'
  };
}
