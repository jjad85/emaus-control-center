/**
 * RF-14 - Instalación del permiso para retirar servidores de equipos.
 *
 * Requisitos:
 * - SheetUtils.js con obtenerLibro(), HOJAS y leerHojaComoObjetos().
 * - InstalacionMatrizRolesPermisos.js reemplazado por la versión del RF-14,
 *   donde EQUIPOS_RETIRAR_SERVIDOR forma parte del catálogo.
 *
 * Ejecutar una sola vez:
 * instalarRF14AjustesPagosSesionEquipos()
 */
function instalarRF14AjustesPagosSesionEquipos() {
  var libro = obtenerLibro();
  var nombreHojaRoles = (typeof HOJAS !== 'undefined' && HOJAS.ROLES)
    ? HOJAS.ROLES
    : 'Roles';
  var nombreHojaMatriz = (typeof HOJAS !== 'undefined' && HOJAS.PERMISOS_ROL)
    ? HOJAS.PERMISOS_ROL
    : 'PermisosRol';

  var hojaRoles = libro.getSheetByName(nombreHojaRoles);
  var hojaMatriz = libro.getSheetByName(nombreHojaMatriz);

  if (!hojaRoles) {
    throw new Error('No existe la hoja "' + nombreHojaRoles + '".');
  }

  if (!hojaMatriz) {
    hojaMatriz = libro.insertSheet(nombreHojaMatriz);
    hojaMatriz.appendRow(['Rol', 'Permiso', 'Activo']);
  } else if (hojaMatriz.getLastRow() === 0) {
    hojaMatriz.appendRow(['Rol', 'Permiso', 'Activo']);
  }

  var codigoNuevo = 'EQUIPOS_RETIRAR_SERVIDOR';
  var permisosQueHabilitanPorDefecto = {
    'EQUIPOS_EDITAR': true,
    'EQUIPOS_ASIGNAR_SERVIDOR': true,
    'EDITAR_EQUIPOS': true
  };

  var roles = leerHojaComoObjetos(nombreHojaRoles)
    .filter(function(item) {
      var activo = String(item.activo || '').trim().toLowerCase();
      return activo === '' || activo === 'sí' || activo === 'si' || activo === 'true' || activo === '1';
    })
    .map(function(item) {
      return String(item.rol || '').trim();
    })
    .filter(function(rol) {
      return rol !== '';
    });

  var filasMatriz = leerHojaComoObjetos(nombreHojaMatriz);
  var permisosActivosPorRol = {};
  var filaPermisoNuevoPorRol = {};

  filasMatriz.forEach(function(item, indice) {
    var rol = String(item.rol || '').trim();
    var permiso = String(item.permiso || '').trim().toUpperCase();
    var activo = String(item.activo || '').trim().toLowerCase();
    var estaActivo = activo === 'sí' || activo === 'si' || activo === 'true' || activo === '1';

    if (!permisosActivosPorRol[rol]) permisosActivosPorRol[rol] = {};
    if (estaActivo) permisosActivosPorRol[rol][permiso] = true;

    if (permiso === codigoNuevo) {
      filaPermisoNuevoPorRol[rol] = indice + 2;
    }
  });

  var creados = 0;
  var actualizados = 0;

  roles.forEach(function(rol) {
    var permisosRol = permisosActivosPorRol[rol] || {};
    var rolNormalizado = rol.toUpperCase();
    var habilitar = rolNormalizado === 'ADMIN' || Object.keys(permisosQueHabilitanPorDefecto).some(function(permiso) {
      return !!permisosRol[permiso];
    });
    var valorActivo = habilitar ? 'Sí' : 'No';

    if (filaPermisoNuevoPorRol[rol]) {
      hojaMatriz.getRange(filaPermisoNuevoPorRol[rol], 3).setValue(valorActivo);
      actualizados++;
    } else {
      hojaMatriz.appendRow([rol, codigoNuevo, valorActivo]);
      creados++;
    }
  });

  if (typeof limpiarCachePermisos === 'function') {
    limpiarCachePermisos();
  }

  SpreadsheetApp.flush();

  return {
    instalado: true,
    permiso: codigoNuevo,
    rolesProcesados: roles.length,
    registrosCreados: creados,
    registrosActualizados: actualizados,
    nota: 'El permiso quedó visible en la matriz para todos los roles activos.'
  };
}
