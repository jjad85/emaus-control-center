/**
 * Corrige la visibilidad del permiso ASPIRANTES_REGISTRAR en la matriz.
 * No elimina ni reconstruye la configuración existente.
 * Ejecutar una sola vez: corregirPermisoRegistrarAspiranteEnMatriz()
 */
function corregirPermisoRegistrarAspiranteEnMatriz() {
  const permiso = 'ASPIRANTES_REGISTRAR';
  const roles = [
    { codigo: 'ADMIN', activo: 'Sí' },
    { codigo: 'AUDIOVISUAL', activo: 'No' },
    { codigo: 'LIDER_RETIRO', activo: 'Sí' },
    { codigo: 'LIDER_MESA', activo: 'Sí' },
    { codigo: 'SERVIDOR', activo: 'Sí' },
    { codigo: 'REGISTRO', activo: 'Sí' },
    { codigo: 'TESORERIA', activo: 'No' },
    { codigo: 'CAMPANERO', activo: 'No' },
    { codigo: 'LOGISTICA', activo: 'No' }
  ];

  const hoja = obtenerHoja(HOJAS.PERMISOS_ROL);
  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(convertirEncabezado);
  const iRol = encabezados.indexOf('rol');
  const iPermiso = encabezados.indexOf('permiso');
  const iActivo = encabezados.indexOf('activo');

  if (iRol < 0 || iPermiso < 0 || iActivo < 0) {
    throw new Error('PermisosRol debe contener las columnas Rol, Permiso y Activo.');
  }

  roles.forEach(function(item) {
    const rolNormalizado = normalizarCodigoRol_(item.codigo);
    let filaEncontrada = -1;

    for (var i = 1; i < datos.length; i += 1) {
      if (
        normalizarCodigoRol_(datos[i][iRol]) === rolNormalizado &&
        normalizarPermiso(datos[i][iPermiso]) === permiso
      ) {
        filaEncontrada = i + 1;
        break;
      }
    }

    if (filaEncontrada > 0) {
      // Conserva la decisión actual del administrador si ya existe una fila.
      const valorActual = hoja.getRange(filaEncontrada, iActivo + 1).getValue();
      if (valorActual === '' || valorActual === null) {
        hoja.getRange(filaEncontrada, iActivo + 1).setValue(item.activo);
      }
    } else {
      hoja.appendRow([item.codigo, permiso, item.activo]);
    }
  });

  limpiarCachePermisos();
  SpreadsheetApp.flush();

  return {
    corregido: true,
    permiso: permiso,
    mensaje: 'El permiso Registrar aspirante ya está disponible en la matriz de Administración.'
  };
}
