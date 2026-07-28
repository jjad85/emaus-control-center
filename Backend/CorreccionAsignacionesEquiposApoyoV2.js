/**
 * Ejecutar una sola vez después de reemplazar EquiposAdministracionService.js.
 * Elimina las filas incompletas creadas por el mapeo anterior y valida los encabezados.
 */
function corregirAsignacionesEquiposApoyoV2() {
  var hoja = obtenerHojaServidorEquipos_();
  var encabezados = obtenerEncabezadosEquipo_(hoja);
  var requeridos = [
    'id',
    'servidorId',
    'servidorNombre',
    'equipoId',
    'tipoAsignacion',
    'activo'
  ];

  var faltantes = requeridos.filter(function(clave) {
    return encabezados.indexOf(clave) < 0;
  });

  if (faltantes.length) {
    throw new Error(
      'No fue posible reconocer estas columnas de ServidorEquipos: ' +
      faltantes.join(', ') +
      '. Encabezados detectados: ' + encabezados.join(', ')
    );
  }

  var eliminadas = 0;
  for (var fila = hoja.getLastRow(); fila >= 2; fila -= 1) {
    var valores = hoja
      .getRange(fila, 1, 1, hoja.getLastColumn())
      .getDisplayValues()[0];
    var registro = {};

    encabezados.forEach(function(clave, columna) {
      registro[clave] = valores[columna];
    });

    var tieneContenido = valores.some(function(valor) {
      return String(valor || '').trim() !== '';
    });

    if (
      tieneContenido &&
      (!String(registro.servidorId || '').trim() ||
        !String(registro.equipoId || '').trim())
    ) {
      hoja.deleteRow(fila);
      eliminadas += 1;
    }
  }

  SpreadsheetApp.flush();

  return {
    ok: true,
    mensaje:
      'Corrección aplicada. Filas incompletas eliminadas: ' + eliminadas +
      '. Vuelva a asignar los servidores afectados.',
    encabezadosDetectados: encabezados
  };
}

/**
 * Prueba rápida. Debe devolver servidorId y equipoId exactamente así.
 */
function diagnosticarEncabezadosServidorEquiposV2() {
  var hoja = obtenerHojaServidorEquipos_();
  return obtenerEncabezadosEquipo_(hoja);
}
