/**
 * Corrige los equipos históricos que quedaron sin ID por la normalización
 * incorrecta del encabezado "ID".
 *
 * Ejecutar una sola vez después de reemplazar EquiposAdministracionService.js.
 */
function corregirEquiposSinIdRF13() {
  var hoja = obtenerHojaAdministracionEquipos_();
  var encabezados = obtenerEncabezadosEquipo_(hoja);
  var columnaId = encabezados.indexOf('id');
  var columnaNombre = encabezados.indexOf('nombre');

  if (columnaId < 0) {
    throw new Error('No fue posible localizar la columna ID en la hoja Equipos.');
  }

  if (hoja.getLastRow() < 2) {
    return {
      ok: true,
      corregidos: 0,
      mensaje: 'La hoja Equipos no tiene registros para corregir.'
    };
  }

  var rango = hoja.getRange(2, 1, hoja.getLastRow() - 1, hoja.getLastColumn());
  var valores = rango.getValues();
  var idsUsados = {};
  var corregidos = 0;

  valores.forEach(function(fila) {
    var nombre = columnaNombre >= 0 ? String(fila[columnaNombre] || '').trim() : '';
    var id = String(fila[columnaId] || '').trim();

    if (!nombre) return;

    if (!id || idsUsados[id]) {
      id = generarIdEquipoAdministrable_();
      fila[columnaId] = id;
      corregidos += 1;
    }

    idsUsados[id] = true;
  });

  rango.setValues(valores);
  SpreadsheetApp.flush();

  return {
    ok: true,
    corregidos: corregidos,
    mensaje: corregidos + ' equipo(s) corregido(s) con ID.'
  };
}
