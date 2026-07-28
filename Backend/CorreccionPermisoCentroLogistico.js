/**
 * Corrige la incorporación del Centro Logístico en la matriz de permisos.
 * Ejecutar una sola vez después de reemplazar InstalacionMatrizRolesPermisos.js.
 */
function corregirPermisoCentroLogisticoEnMatriz() {
  var libro = obtenerLibro();
  var hoja = asegurarHojaConEncabezados_(
    libro,
    HOJAS.PERMISOS_ROL,
    ['Rol', 'Permiso', 'Activo']
  );

  var permiso = 'CENTRO_LOGISTICO_VER';
  var rolesIniciales = ['ADMIN', 'LOGISTICA', 'LIDER_RETIRO'];
  var roles = leerHojaComoObjetos(HOJAS.ROLES);
  var existentes = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  var indice = {};

  existentes.forEach(function(item, posicion) {
    var clave = normalizarTexto(item.rol) + '|' + normalizarPermiso(item.permiso);
    indice[clave] = posicion + 2;
  });

  roles.forEach(function(item) {
    var rol = String(item.rol || '').trim();
    if (!rol) return;

    var rolNormalizado = normalizarPermiso(rol);
    var clave = normalizarTexto(rol) + '|' + permiso;
    var fila = indice[clave];

    // Conserva la configuración existente. Solo asigna el valor inicial cuando crea la fila.
    if (!fila) {
      var activo = rolesIniciales.indexOf(rolNormalizado) >= 0 ? 'Sí' : 'No';
      hoja.appendRow([rol, permiso, activo]);
    }
  });

  limpiarCachePermisos();
  SpreadsheetApp.flush();

  return {
    corregido: true,
    permiso: permiso,
    modulo: 'Logística',
    pagina: 'Centro Logístico',
    accion: 'Consultar panel y reportes'
  };
}
