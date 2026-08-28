/**
 * Corrección 6.26.3
 *
 * Garantiza los permisos de desasignación exclusivamente para:
 * - ADMIN
 * - LIDER_RETIRO
 *
 * Ejecutar una sola vez y volver a iniciar sesión.
 */
function instalarPermisosDesasignarCaminantes() {
  var libro = obtenerLibro();
  var hoja = libro.getSheetByName(HOJAS.PERMISOS_ROL);

  if (!hoja) {
    throw crearErrorAplicacion(
      'HOJA_PERMISOS_NO_EXISTE',
      'No existe la hoja de permisos por rol.'
    );
  }

  var permisos = [
    'MESAS_DESASIGNAR_CAMINANTE',
    'HABITACIONES_DESASIGNAR_CAMINANTE'
  ];

  var rolesPermitidos = [
    'ADMIN',
    'LIDER_RETIRO'
  ];

  var rolesSistema = [
    'ADMIN',
    'AUDIOVISUAL',
    'LIDER_RETIRO',
    'LIDER_MESA',
    'SERVIDOR',
    'REGISTRO',
    'TESORERIA',
    'CAMPANERO',
    'LOGISTICA',
    'ANGELITOS'
  ];

  var encabezados = hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .getDisplayValues()[0]
    .map(function(x) {
      return normalizarTexto(x)
        .replace(/[^a-z0-9]/g, '');
    });

  var colRol = encabezados.indexOf('rol') + 1;
  var colPermiso = encabezados.indexOf('permiso') + 1;
  var colActivo = encabezados.indexOf('activo') + 1;

  if (!colRol || !colPermiso || !colActivo) {
    throw crearErrorAplicacion(
      'ESTRUCTURA_PERMISOS_INVALIDA',
      'La hoja PermisosRol debe contener Rol, Permiso y Activo.'
    );
  }

  permisos.forEach(function(permiso) {
    rolesSistema.forEach(function(rol) {
      var registros = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);

      var existente = registros.find(function(item) {
        return (
          normalizarCodigoRol_(item.rol) ===
            normalizarCodigoRol_(rol) &&
          normalizarPermiso(item.permiso) ===
            normalizarPermiso(permiso)
        );
      });

      var activo =
        rolesPermitidos.indexOf(rol) >= 0
          ? 'Sí'
          : 'No';

      if (existente) {
        var fila = registros.indexOf(existente) + 2;
        hoja.getRange(fila, colActivo).setValue(activo);
      } else {
        var nuevaFila = new Array(hoja.getLastColumn()).fill('');
        nuevaFila[colRol - 1] = rol;
        nuevaFila[colPermiso - 1] = permiso;
        nuevaFila[colActivo - 1] = activo;
        hoja.appendRow(nuevaFila);
      }
    });
  });

  limpiarCachePermisos();
  SpreadsheetApp.flush();

  var verificacion = {};
  var actualizados = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);

  rolesPermitidos.forEach(function(rol) {
    verificacion[rol] = {};

    permisos.forEach(function(permiso) {
      verificacion[rol][permiso] =
        actualizados.some(function(item) {
          return (
            normalizarCodigoRol_(item.rol) ===
              normalizarCodigoRol_(rol) &&
            normalizarPermiso(item.permiso) ===
              normalizarPermiso(permiso) &&
            convertirBooleano(item.activo)
          );
        });
    });
  });

  return {
    instalado: true,
    verificacion: verificacion
  };
}
