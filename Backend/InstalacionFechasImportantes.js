/**
 * Crea la hoja FechasImportantes utilizada por el dashboard.
 * Estructura mínima: Fecha | Descripción
 */
function instalarFechasImportantes() {
  var libro = obtenerLibro();
  var nombreHoja = HOJAS.FECHAS_IMPORTANTES;
  var hoja = libro.getSheetByName(nombreHoja);

  if (!hoja) {
    hoja = libro.insertSheet(nombreHoja);
  }

  var encabezados = ['Fecha', 'Descripción'];

  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  } else {
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  }

  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, encabezados.length)
    .setFontWeight('bold')
    .setBackground('#17233f')
    .setFontColor('#ffffff');
  hoja.getRange('A:A').setNumberFormat('dd/mm/yyyy');
  hoja.setColumnWidth(1, 130);
  hoja.setColumnWidth(2, 420);

  if (hoja.getLastRow() === 1) {
    hoja.getRange(2, 1, 3, 2).setValues([
      ['', 'Cierre de inscripciones'],
      ['', 'Fecha límite para recibir presentaciones'],
      ['', 'Inicio del retiro']
    ]);
  }

  return {
    instalado: true,
    hoja: nombreHoja,
    columnas: encabezados
  };
}
