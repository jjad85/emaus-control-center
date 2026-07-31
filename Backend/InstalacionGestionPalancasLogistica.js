/** Instalador idempotente de la Entrega 3 - Gestión de palancas por Logística. */
function instalarGestionPalancasLogistica() {
  const libro = obtenerLibro();
  const hojaTemas = libro.getSheetByName(HOJAS.TEMAS);
  if (!hojaTemas) throw new Error('No existe la hoja de Temas.');

  const columnas = [
    'palancaObservacionesLogistica',
    'palancaUltimaActualizacionLogistica',
    'palancaAprobadaLogisticaPor',
    'palancaFechaAprobacionLogistica',
    'palancaEntregadaEjecucionPor',
    'palancaFechaEntregaEjecucion'
  ];
  const ultimaColumna = Math.max(hojaTemas.getLastColumn(), 1);
  const encabezados = hojaTemas.getRange(1, 1, 1, ultimaColumna).getValues()[0].map(String);
  const faltantes = columnas.filter(function(columna) { return encabezados.indexOf(columna) < 0; });
  if (faltantes.length) hojaTemas.getRange(1, encabezados.length + 1, 1, faltantes.length).setValues([faltantes]);

  const permiso = 'GESTIONAR_PALANCAS_LOGISTICA';
  const rolesHabilitados = ['ADMIN', 'LOGISTICA'];
  const hojaPermisos = asegurarHojaConEncabezados_(libro, HOJAS.PERMISOS_ROL, ['Rol', 'Permiso', 'Activo']);
  const roles = leerHojaComoObjetos(HOJAS.ROLES)
    .filter(function(item) { return item.activo === undefined || convertirBooleano(item.activo); })
    .map(function(item) { return String(item.rol || '').trim(); }).filter(Boolean);
  const existentes = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  const permisosAgregados = [];
  roles.forEach(function(rol) {
    const encontrado = existentes.find(function(item) {
      return normalizarTexto(item.rol) === normalizarTexto(rol) && normalizarPermiso(item.permiso) === permiso;
    });
    if (!encontrado) {
      const activo = rolesHabilitados.some(function(codigo) { return normalizarTexto(codigo) === normalizarTexto(rol); });
      hojaPermisos.appendRow([rol, permiso, activo ? 'Sí' : 'No']);
      permisosAgregados.push(rol);
    }
  });

  instalarConfiguracionAlertas();
  limpiarCachePermisos();
  SpreadsheetApp.flush();
  return { instalado: true, columnasAgregadas: faltantes, permiso: permiso, permisosAgregados: permisosAgregados, mensaje: 'Entrega 3 instalada correctamente.' };
}
