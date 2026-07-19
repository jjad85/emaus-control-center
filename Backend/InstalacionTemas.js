/**
 * Instala o ajusta el módulo administrativo de Temas.
 * Ejecutar manualmente una vez desde Apps Script.
 */
function instalarModuloTemas() {
  const libro = obtenerLibro();
  const nombreHoja = HOJAS.TEMAS;
  const encabezados = [
    'ID',
    'Nombre',
    'Servidor ID',
    'Servidor Nombre',
    'Requiere Presentación',
    'Requiere Testimonio',
    'Activo',
    'Fecha Registro',
    'Fecha Actualización',
    'Actualizado Por'
  ];

  let hoja = libro.getSheetByName(nombreHoja);

  if (!hoja) {
    hoja = libro.insertSheet(nombreHoja);
  }

  if (hoja.getLastColumn() === 0) {
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  } else {
    const actuales = hoja
      .getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 1))
      .getDisplayValues()[0]
      .map(function(valor) { return String(valor || '').trim(); });

    encabezados.forEach(function(encabezado) {
      if (!actuales.includes(encabezado)) {
        hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
        actuales.push(encabezado);
      }
    });
  }

  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, hoja.getLastColumn())
    .setFontWeight('bold')
    .setBackground('#173b34')
    .setFontColor('#ffffff');
  hoja.autoResizeColumns(1, hoja.getLastColumn());

  return {
    instalado: true,
    hoja: nombreHoja,
    columnas: encabezados.length
  };
}
