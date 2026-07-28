/** RF-13: ejecutar una sola vez. */
function instalarRF13AjustesFuncionales() {
  var libro = obtenerLibro();
  instalarRolSacerdoteConsulta_();
  migrarHoraFechasImportantes_(libro);
  migrarEquiposSinIdYEliminarOrden_(libro);
  limpiarCachePermisos();
  SpreadsheetApp.flush();
  return { instalado: true, mensaje: 'RF-13 instalado correctamente.' };
}

function instalarRolSacerdoteConsulta_() {
  var roles = obtenerHoja(HOJAS.ROLES);
  var existentes = leerHojaComoObjetos(HOJAS.ROLES);
  if (!existentes.some(function(x){ return normalizarTexto(x.rol) === 'sacerdote'; })) {
    roles.appendRow(['SACERDOTE','Consulta general del retiro sin permisos de modificación.','Sí']);
  }
  var catalogo = obtenerCatalogoPermisosDefinitivo_();
  var permitidos = catalogo.filter(function(p){
    var texto = normalizarTexto((p.accion || '') + ' ' + (p.codigo || ''));
    return /ver|consultar|exportar|descargar/.test(texto) && !/sistema_todo|usuarios_|fechas_importantes_gestionar/.test(normalizarTexto(p.codigo));
  }).map(function(p){ return p.codigo; });
  ['DASHBOARD_VER','MI_CUENTA_VER'].forEach(function(p){ if (permitidos.indexOf(p)<0) permitidos.push(p); });
  var hoja = obtenerHoja(HOJAS.PERMISOS_ROL);
  var registros = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  catalogo.forEach(function(p){
    var fila = registros.find(function(r){ return normalizarTexto(r.rol)==='sacerdote' && normalizarPermiso(r.permiso)===p.codigo; });
    var activo = permitidos.indexOf(p.codigo)>=0 ? 'Sí':'No';
    if (fila && fila.__fila) hoja.getRange(fila.__fila,3).setValue(activo); else hoja.appendRow(['SACERDOTE',p.codigo,activo]);
  });
}

function migrarHoraFechasImportantes_(libro) {
  var hoja = libro.getSheetByName(HOJAS.FECHAS_IMPORTANTES);
  if (!hoja) return;
  var encabezados = hoja.getRange(1,1,1,hoja.getLastColumn()).getDisplayValues()[0];
  if (!encabezados.some(function(x){return normalizarTexto(x)==='hora';})) hoja.getRange(1,hoja.getLastColumn()+1).setValue('Hora');
}

function migrarEquiposSinIdYEliminarOrden_(libro) {
  var hoja = libro.getSheetByName('Equipos');
  if (!hoja || hoja.getLastRow()<1) return;
  var encabezados = hoja.getRange(1,1,1,hoja.getLastColumn()).getDisplayValues()[0];
  var idxId = encabezados.findIndex(function(x){return normalizarTexto(x)==='id';});
  if (idxId<0) { hoja.insertColumnBefore(1); hoja.getRange(1,1).setValue('ID'); idxId=0; encabezados.unshift('ID'); }
  for (var f=2; f<=hoja.getLastRow(); f++) if (!String(hoja.getRange(f,idxId+1).getValue()||'').trim()) hoja.getRange(f,idxId+1).setValue(Utilities.getUuid());
  var idxOrden = encabezados.findIndex(function(x){return normalizarTexto(x)==='orden';});
  if (idxOrden>=0) hoja.deleteColumn(idxOrden+1);
}
