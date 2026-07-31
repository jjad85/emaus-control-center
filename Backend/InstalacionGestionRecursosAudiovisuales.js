/**
 * Instalador idempotente de la Entrega 2.1.
 * Agrega a la hoja Temas las columnas necesarias para la gestión
 * de canciones y videos por parte de Audiovisuales.
 */
function instalarGestionRecursosAudiovisuales() {
  const hoja = obtenerHoja(HOJAS.TEMAS);

  const columnas = [
    'cancionObservacionesAudiovisuales',
    'cancionAprobadaPor',
    'cancionFechaAprobacion',
    'cancionArchivoDefinitivoId',
    'cancionArchivoDefinitivoNombre',
    'cancionArchivoDefinitivoUrl',
    'videoObservacionesAudiovisuales',
    'videoAprobadaPor',
    'videoFechaAprobacion',
    'videoArchivoDefinitivoId',
    'videoArchivoDefinitivoNombre',
    'videoArchivoDefinitivoUrl'
  ];

  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const encabezados = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(function(valor) { return String(valor || '').trim(); });

  const faltantes = columnas.filter(function(columna) {
    return encabezados.indexOf(columna) < 0;
  });

  if (faltantes.length > 0) {
    hoja
      .getRange(1, ultimaColumna + 1, 1, faltantes.length)
      .setValues([faltantes]);
  }

  SpreadsheetApp.flush();

  return {
    hoja: HOJAS.TEMAS,
    columnasAgregadas: faltantes,
    totalAgregadas: faltantes.length,
    mensaje: faltantes.length > 0
      ? 'Se agregaron ' + faltantes.length + ' columnas.'
      : 'La estructura ya se encontraba actualizada.'
  };
}
