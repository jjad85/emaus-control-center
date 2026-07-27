/**
 * Instala el permiso para registrar aspirantes desde una sesión autenticada.
 * Ejecutar una sola vez: instalarRegistroAspirantesPorServidores()
 */
function instalarRegistroAspirantesPorServidores() {
  const hoja = obtenerHoja(HOJAS.PERMISOS_ROL);
  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(convertirEncabezado);
  const iRol = encabezados.indexOf('rol');
  const iPermiso = encabezados.indexOf('permiso');
  const iActivo = encabezados.indexOf('activo');

  if (iRol < 0 || iPermiso < 0 || iActivo < 0) {
    throw new Error('PermisosRol debe contener Rol, Permiso y Activo.');
  }

  const permiso = 'ASPIRANTES_REGISTRAR';
  const roles = ['ADMIN', 'LIDER_RETIRO', 'SERVIDOR', 'LIDER_MESA', 'LOGISTICA', 'REGISTRO'];

  roles.forEach(function(rol) {
    const rolCodigo = normalizarCodigoRol_(rol);
    let fila = -1;

    for (var i = 1; i < datos.length; i += 1) {
      if (
        normalizarCodigoRol_(datos[i][iRol]) === rolCodigo &&
        normalizarPermiso(datos[i][iPermiso]) === permiso
      ) {
        fila = i + 1;
        break;
      }
    }

    const activoInicial = ['admin', 'lider_retiro', 'servidor', 'lider_mesa', 'registro'].indexOf(rolCodigo) >= 0
      ? 'Sí'
      : 'No';

    if (fila > 0) {
      hoja.getRange(fila, iActivo + 1).setValue(activoInicial);
    } else {
      hoja.appendRow([rol, permiso, activoInicial]);
    }
  });

  limpiarCachePermisos();
  SpreadsheetApp.flush();

  return {
    instalado: true,
    permiso: permiso,
    mensaje: 'Permiso de registro de aspirantes instalado correctamente.'
  };
}
