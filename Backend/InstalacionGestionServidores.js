/**
 * Ejecutar una sola vez después de desplegar el backend.
 * Agrega únicamente las columnas faltantes; no borra ni reemplaza datos.
 */
function instalarGestionServidores() {
  const hoja = obtenerHoja(HOJAS.SERVIDORES);
  const requeridos = [
    'Rol Mesa',
    'Rol Equipo',
    'Tema ID',
    'Activo',
    'Fecha Actualización',
    'Actualizado Por'
  ];

  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const actuales = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0]
    .map(function(valor) { return normalizarTexto(valor); });

  requeridos.forEach(function(encabezado) {
    if (!actuales.includes(normalizarTexto(encabezado))) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
      actuales.push(normalizarTexto(encabezado));
    }
  });

  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, hoja.getLastColumn());
  return { instalado: true, hoja: HOJAS.SERVIDORES, columnas: requeridos };
}
