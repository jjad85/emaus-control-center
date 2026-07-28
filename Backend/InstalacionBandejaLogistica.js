/**
 * RF-11 - Corrección de permisos para la bandeja de Logística.
 *
 * Ejecutar una sola vez:
 * corregirPermisosBandejaAprobacionesLogistica()
 */
function corregirPermisosBandejaAprobacionesLogistica() {
  const libro = obtenerLibro();
  const hojaPermisos = asegurarHojaConEncabezados_(
    libro,
    HOJAS.PERMISOS_ROL,
    ['Rol', 'Permiso', 'Activo']
  );

  const asignaciones = [
    ['LOGISTICA', 'LOGISTICA_CONSULTAR_BANDEJA'],
    ['LOGISTICA', 'CAMINANTES_APROBAR_ENTREGA_LOGISTICA'],
    ['ADMIN', 'LOGISTICA_CONSULTAR_BANDEJA'],
    ['ADMIN', 'CAMINANTES_APROBAR_ENTREGA_LOGISTICA']
  ];

  const filas = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  const agregados = [];
  const reactivados = [];

  asignaciones.forEach(function(asignacion) {
    const rol = asignacion[0];
    const permiso = asignacion[1];

    const indice = filas.findIndex(function(item) {
      return normalizarTexto(item.rol) === normalizarTexto(rol) &&
        normalizarPermiso(item.permiso) === permiso;
    });

    if (indice < 0) {
      hojaPermisos.appendRow([rol, permiso, 'Sí']);
      filas.push({ rol: rol, permiso: permiso, activo: 'Sí' });
      agregados.push(rol + ' - ' + permiso);
      return;
    }

    if (!convertirBooleano(filas[indice].activo)) {
      // +2 porque el arreglo no incluye encabezado y Sheets inicia en 1.
      hojaPermisos.getRange(indice + 2, 3).setValue('Sí');
      filas[indice].activo = 'Sí';
      reactivados.push(rol + ' - ' + permiso);
    }
  });

  limpiarCachePermisos();
  SpreadsheetApp.flush();

  return {
    corregido: true,
    agregados: agregados,
    reactivados: reactivados,
    mensaje: 'Los roles ADMIN y LOGISTICA ya pueden consultar y aprobar la bandeja de Logística.'
  };
}

/**
 * Conserva compatibilidad con el nombre del instalador anterior.
 */
function instalarBandejaAprobacionesLogistica() {
  return corregirPermisosBandejaAprobacionesLogistica();
}
