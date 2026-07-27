/**
 * RF-09 - Servidores exentos de pago.
 * Ejecutar una sola vez después de desplegar el backend.
 * Agrega únicamente las columnas faltantes y no elimina información.
 */
function instalarServidoresExentosPago() {
  const hoja = obtenerHoja(HOJAS.SERVIDORES);
  const requeridos = ['Exento de Pago', 'Motivo Exención Pago', 'Saldo Pendiente'];
  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const actuales = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0]
    .map(function(valor) { return normalizarTexto(valor); });

  requeridos.forEach(function(encabezado) {
    if (actuales.indexOf(normalizarTexto(encabezado)) < 0) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
      actuales.push(normalizarTexto(encabezado));
    }
  });

  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, hoja.getLastColumn());
  return { instalado: true, hoja: HOJAS.SERVIDORES, columnas: requeridos };
}
