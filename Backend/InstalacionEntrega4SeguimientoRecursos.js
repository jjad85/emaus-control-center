/** Instalador idempotente de la Entrega 4. */
function instalarEntrega4SeguimientoRecursos() {
  asegurarHojaHistorialRecursosTema_();
  const permisos = [
    { codigo:'CONSULTAR_HISTORIAL_RECURSOS', descripcion:'Consultar el historial de cambios de canciones, videos y palancas.' },
    { codigo:'REPORTES_RECURSOS_TEMA', descripcion:'Consultar y exportar el reporte consolidado de recursos de los temas.' }
  ];
  const rolesActivos = ['ADMIN','AUDIOVISUAL','LOGISTICA','LIDER_RETIRO'];
  permisos.forEach(function(p) { instalarPermisoEntrega4_(p, rolesActivos); });
  SpreadsheetApp.flush();
  return { instalado:true, hoja:HOJA_HISTORIAL_RECURSOS_TEMA, permisos:permisos.map(function(x){ return x.codigo; }) };
}

function instalarPermisoEntrega4_(permiso, rolesActivos) {
  const hojaPermisos = obtenerLibro().getSheetByName(HOJAS.PERMISOS);
  if (hojaPermisos) {
    const existentes = leerHojaComoObjetos(HOJAS.PERMISOS);
    if (!existentes.some(function(x){ return normalizarTexto(x.permiso || x.codigo) === normalizarTexto(permiso.codigo); })) {
      hojaPermisos.appendRow([permiso.codigo, permiso.descripcion, 'Sí', new Date(), 'INSTALADOR']);
    }
  }
  const hojaMatriz = obtenerLibro().getSheetByName(HOJAS.ROLES_PERMISOS);
  if (!hojaMatriz) return;
  const existentesMatriz = leerHojaComoObjetos(HOJAS.ROLES_PERMISOS);
  obtenerRolesAlertas_().forEach(function(r) {
    const existe = existentesMatriz.some(function(x) { return normalizarTexto(x.rol) === normalizarTexto(r.rol) && normalizarTexto(x.permiso) === normalizarTexto(permiso.codigo); });
    if (!existe) hojaMatriz.appendRow([r.rol, permiso.codigo, rolesActivos.indexOf(r.rol) >= 0 ? 'Sí' : 'No', new Date(), 'INSTALADOR']);
  });
}
