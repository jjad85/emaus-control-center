/**
 * ENTREGA 2.3 - Integración de permisos y alertas de recursos audiovisuales.
 * Es idempotente: puede ejecutarse varias veces sin duplicar registros.
 */
function instalarEntrega23RecursosAudiovisuales() {
  const libro = obtenerLibro();
  const permiso = 'GESTIONAR_RECURSOS_AUDIOVISUALES';
  const rolesHabilitados = ['ADMIN', 'AUDIOVISUAL'];

  const hojaPermisos = asegurarHojaConEncabezados_(
    libro,
    HOJAS.PERMISOS_ROL,
    ['Rol', 'Permiso', 'Activo']
  );

  const roles = leerHojaComoObjetos(HOJAS.ROLES)
    .filter(function(item) {
      return item.activo === undefined || convertirBooleano(item.activo);
    })
    .map(function(item) { return String(item.rol || '').trim(); })
    .filter(Boolean);

  const permisosExistentes = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  const agregados = [];
  const actualizados = [];

  roles.forEach(function(rol) {
    const indice = permisosExistentes.findIndex(function(item) {
      return normalizarTexto(item.rol) === normalizarTexto(rol) &&
        normalizarPermiso(item.permiso) === permiso;
    });
    const activo = rolesHabilitados.some(function(codigo) {
      return normalizarTexto(codigo) === normalizarTexto(rol);
    }) ? 'Sí' : 'No';

    if (indice < 0) {
      hojaPermisos.appendRow([rol, permiso, activo]);
      agregados.push(rol);
    } else if (activo === 'Sí' && !convertirBooleano(permisosExistentes[indice].activo)) {
      hojaPermisos.getRange(indice + 2, 3).setValue('Sí');
      actualizados.push(rol);
    }
  });

  const resultadoColumnas = instalarGestionRecursosAudiovisuales();
  const resultadoAlertas = instalarConfiguracionAlertas();
  limpiarCachePermisos();
  SpreadsheetApp.flush();

  return {
    instalado: true,
    permiso: permiso,
    rolesConPermisoAgregado: agregados,
    rolesActivados: actualizados,
    columnasAudiovisuales: resultadoColumnas,
    alertas: resultadoAlertas,
    mensaje: 'Entrega 2.3 instalada correctamente.'
  };
}
