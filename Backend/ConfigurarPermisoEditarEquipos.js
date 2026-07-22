/**
 * Ejecutar una sola vez.
 *
 * Agrega el permiso EDITAR_EQUIPOS al rol Administrador.
 * Después podrá administrarse desde la matriz de permisos normal.
 */
function configurarPermisoEditarEquipos() {
  var libro = obtenerLibro();
  var hoja = libro.getSheetByName(HOJAS.PERMISOS_ROL);

  if (!hoja) {
    throw new Error(
      'No existe la hoja PermisosRol. Ejecute primero la instalación de seguridad.'
    );
  }

  var encabezados = hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .getDisplayValues()[0]
    .map(function(valor) {
      return normalizarTexto(valor);
    });

  var columnaRol = encabezados.indexOf('rol');
  var columnaPermiso = encabezados.indexOf('permiso');
  var columnaActivo = encabezados.indexOf('activo');

  if (
    columnaRol < 0 ||
    columnaPermiso < 0 ||
    columnaActivo < 0
  ) {
    throw new Error(
      'La hoja PermisosRol debe contener las columnas Rol, Permiso y Activo.'
    );
  }

  var registros = hoja.getLastRow() >= 2
    ? hoja
        .getRange(
          2,
          1,
          hoja.getLastRow() - 1,
          hoja.getLastColumn()
        )
        .getDisplayValues()
    : [];

  var filaExistente = 0;

  registros.some(function(fila, indice) {
    var coincide =
      normalizarTexto(fila[columnaRol]) === 'administrador' &&
      normalizarPermiso(fila[columnaPermiso]) === 'EDITAR_EQUIPOS';

    if (coincide) {
      filaExistente = indice + 2;
    }

    return coincide;
  });

  if (filaExistente) {
    hoja
      .getRange(filaExistente, columnaActivo + 1)
      .setValue('Sí');
  } else {
    var nuevaFila = new Array(hoja.getLastColumn()).fill('');

    nuevaFila[columnaRol] = 'Administrador';
    nuevaFila[columnaPermiso] = 'EDITAR_EQUIPOS';
    nuevaFila[columnaActivo] = 'Sí';

    hoja
      .getRange(
        hoja.getLastRow() + 1,
        1,
        1,
        nuevaFila.length
      )
      .setValues([nuevaFila]);
  }

  SpreadsheetApp.flush();
  limpiarCachePermisos();

  return {
    configurado: true,
    rol: 'Administrador',
    permiso: 'EDITAR_EQUIPOS',
    mensaje:
      'Permiso EDITAR_EQUIPOS configurado correctamente.'
  };
}
