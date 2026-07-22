/**
 * Ejecutar una sola vez para agregar el documento de identidad
 * a la hoja Servidores sin modificar la información existente.
 */
function instalarDocumentoIdentidadServidores() {
  const hoja = obtenerHoja(HOJAS.SERVIDORES);
  const encabezado = 'Documento Identidad';
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const actuales = hoja
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(function(valor) { return normalizarTexto(valor); });

  if (!actuales.includes(normalizarTexto(encabezado))) {
    hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
  }

  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, hoja.getLastColumn());

  return {
    instalado: true,
    hoja: HOJAS.SERVIDORES,
    columna: encabezado
  };
}
