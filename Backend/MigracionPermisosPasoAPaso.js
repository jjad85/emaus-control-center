/**
 * Migra los permisos existentes de MINUTOGRAMA a PASO_A_PASO.
 * Ejecutar una sola vez después de reemplazar los archivos:
 * migrarPermisosMinutogramaAPasoAPaso()
 */
function migrarPermisosMinutogramaAPasoAPaso() {
  const hoja = obtenerHoja(HOJAS.PERMISOS_ROL);
  const ultimaFila = hoja.getLastRow();
  const ultimaColumna = hoja.getLastColumn();

  if (ultimaFila < 2 || ultimaColumna < 1) {
    return { ok: true, actualizados: 0, mensaje: 'No había permisos para migrar.' };
  }

  const encabezados = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0];
  const indicePermiso = encabezados.findIndex(function(encabezado) {
    return normalizarTexto(encabezado) === 'permiso';
  });

  if (indicePermiso === -1) {
    throw crearErrorAplicacion(
      'PERMISOS_ROL_ESTRUCTURA',
      'La hoja PermisosRol no contiene la columna Permiso.'
    );
  }

  const rango = hoja.getRange(2, 1, ultimaFila - 1, ultimaColumna);
  const valores = rango.getValues();
  let actualizados = 0;

  valores.forEach(function(fila) {
    const permisoActual = String(fila[indicePermiso] || '').trim();
    if (!/_MINUTOGRAMA$/i.test(permisoActual)) return;

    fila[indicePermiso] = permisoActual.replace(/_MINUTOGRAMA$/i, '_PASO_A_PASO');
    actualizados += 1;
  });

  if (actualizados > 0) {
    rango.setValues(valores);
  }

  limpiarCachePermisos();

  return {
    ok: true,
    actualizados: actualizados,
    mensaje: actualizados + ' permisos migrados de Minutograma a Paso a paso.'
  };
}
