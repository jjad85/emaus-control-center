/**
 * Corrige la estructura de la hoja ServidorEquipos después del error de
 * normalización de encabezados con siglas ID.
 *
 * La función:
 * 1. Garantiza los encabezados esperados.
 * 2. Elimina únicamente filas incompletas que no pueden relacionarse con
 *    un servidor y un equipo válidos.
 * 3. Conserva las asignaciones completas.
 *
 * Después de ejecutarla, las filas eliminadas deben registrarse nuevamente
 * desde la pantalla de Equipos de apoyo.
 */
function corregirAsignacionesEquiposApoyoRF13() {
  var libro = obtenerLibro();
  var hoja = libro.getSheetByName('ServidorEquipos');

  if (!hoja) {
    throw new Error(
      'No existe la hoja ServidorEquipos. Ejecute instalarAdministracionEquipos().' 
    );
  }

  var requeridos = [
    'ID',
    'Servidor ID',
    'Servidor Nombre',
    'Equipo ID',
    'Tipo Asignación',
    'Activo',
    'Fecha Inicio',
    'Fecha Fin',
    'Fecha Registro',
    'Fecha Actualización',
    'Actualizado Por'
  ];

  var actuales = hoja.getLastColumn()
    ? hoja.getRange(1, 1, 1, hoja.getLastColumn()).getDisplayValues()[0]
    : [];

  requeridos.forEach(function(encabezado) {
    var clave = normalizarEncabezadoEquipo_(encabezado);
    var existe = actuales.some(function(actual) {
      return normalizarEncabezadoEquipo_(actual) === clave;
    });

    if (!existe) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
      actuales.push(encabezado);
    }
  });

  hoja.getRange(1, 1, 1, hoja.getLastColumn()).setFontWeight('bold');

  var encabezados = obtenerEncabezadosEquipo_(hoja);
  var indiceId = encabezados.indexOf('id');
  var indiceServidorId = encabezados.indexOf('servidorId');
  var indiceEquipoId = encabezados.indexOf('equipoId');
  var eliminadas = 0;

  for (var fila = hoja.getLastRow(); fila >= 2; fila -= 1) {
    var valores = hoja
      .getRange(fila, 1, 1, hoja.getLastColumn())
      .getDisplayValues()[0];

    var id = indiceId >= 0 ? String(valores[indiceId] || '').trim() : '';
    var servidorId = indiceServidorId >= 0
      ? String(valores[indiceServidorId] || '').trim()
      : '';
    var equipoId = indiceEquipoId >= 0
      ? String(valores[indiceEquipoId] || '').trim()
      : '';

    var filaVacia = valores.every(function(valor) {
      return !String(valor || '').trim();
    });

    if (filaVacia) {
      hoja.deleteRow(fila);
      continue;
    }

    // Una asignación sin servidor o sin equipo no puede consultarse ni
    // recuperarse de forma confiable. Se elimina para permitir reasignarla.
    if (!servidorId || !equipoId) {
      hoja.deleteRow(fila);
      eliminadas += 1;
      continue;
    }

    if (!id) {
      hoja.getRange(fila, indiceId + 1).setValue(generarIdAsignacionEquipo_());
    }
  }

  SpreadsheetApp.flush();

  return {
    ok: true,
    filasIncompletasEliminadas: eliminadas,
    mensaje: eliminadas
      ? 'Se eliminaron ' + eliminadas +
        ' asignaciones incompletas. Asígnelas nuevamente desde la aplicación.'
      : 'La hoja ServidorEquipos quedó validada y no tenía filas incompletas.'
  };
}
