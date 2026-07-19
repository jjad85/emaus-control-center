/**
 * Agrega el permiso DESACTIVAR_CAMINANTE al rol Administrador.
 * Ejecute una sola vez y luego ejecute limpiarCachePermisos().
 */
function configurarPermisoDesactivarCaminante() {
  const hoja = obtenerHoja(HOJAS.PERMISOS_ROL);
  hoja.appendRow([
    'Administrador',
    'DESACTIVAR_CAMINANTE',
    'Sí'
  ]);
  limpiarCachePermisos();
}
