/**
 * Entrega 1 - Recursos de Mis Temas.
 * Agrega de forma idempotente las columnas requeridas para canción, video y palanca.
 * Ejecutar manualmente una vez por ambiente: instalarRecursosMisTemas()
 */
function instalarRecursosMisTemas() {
  var libro = obtenerLibro();
  var nombreHoja = (typeof HOJAS !== 'undefined' && HOJAS.TEMAS) ? HOJAS.TEMAS : 'Temas';
  var hoja = libro.getSheetByName(nombreHoja);
  if (!hoja) throw new Error('No existe la hoja "' + nombreHoja + '".');

  var requeridas = [
    'cancionTipo', 'cancionNombre', 'cancionAutor', 'cancionEnlace',
    'cancionObservaciones', 'cancionEstado',
    'usaVideo', 'videoTipo', 'videoNombre', 'videoAutorFuente', 'videoEnlace',
    'videoCompleto', 'videoMinutoInicio', 'videoMinutoFin',
    'videoMomentoReproduccion', 'videoObservaciones', 'videoEstado',
    'palancaDescripcion', 'palancaMomentoEntrega', 'palancaDetalleMomento',
    'palancaFormaEntrega', 'palancaResponsableEntrega', 'palancaDetalleResponsable',
    'palancaCantidad', 'palancaDestinatarios', 'palancaRequierePreparacion',
    'palancaObservaciones'
  ];

  var ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  var existentes = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0]
    .map(function(valor) { return String(valor || '').trim(); });
  var agregadas = [];

  requeridas.forEach(function(encabezado) {
    if (existentes.indexOf(encabezado) >= 0) return;
    hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
    existentes.push(encabezado);
    agregadas.push(encabezado);
  });

  SpreadsheetApp.flush();
  return {
    instalado: true,
    hoja: nombreHoja,
    columnasAgregadas: agregadas,
    totalAgregadas: agregadas.length,
    nota: agregadas.length ? 'Se agregaron las columnas faltantes.' : 'La estructura ya estaba actualizada.'
  };
}
