/** Ejecutar una sola vez después de copiar los archivos del RF-12. */
function instalarCentroLogistico() {
  var libro = obtenerLibro();
  var hoja = asegurarHojaConEncabezados_(libro, HOJAS.PERMISOS_ROL, ['Rol', 'Permiso', 'Activo']);
  var permiso = 'CENTRO_LOGISTICO_VER';
  var rolesActivos = ['ADMIN', 'LOGISTICA', 'LIDER_RETIRO'];
  var roles = leerHojaComoObjetos(HOJAS.ROLES);
  var existentes = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);

  roles.forEach(function(item) {
    var rol = String(item.rol || '').trim();
    if (!rol) return;
    var encontrado = existentes.find(function(fila) {
      return normalizarTexto(fila.rol) === normalizarTexto(rol) &&
        normalizarPermiso(fila.permiso) === permiso;
    });
    var activo = rolesActivos.indexOf(normalizarPermiso(rol)) >= 0 ? 'Sí' : 'No';
    if (encontrado) {
      var fila = existentes.indexOf(encontrado) + 2;
      hoja.getRange(fila, 3).setValue(activo);
    } else {
      hoja.appendRow([rol, permiso, activo]);
    }
  });

  limpiarCachePermisos();
  SpreadsheetApp.flush();
  return { instalado: true, permiso: permiso, rolesIniciales: rolesActivos };
}
