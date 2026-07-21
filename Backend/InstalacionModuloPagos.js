function instalarModuloPagos() {
  const libro=obtenerLibro();
  const encabezados=['ID','Caminante ID','Retiro ID','Valor Reportado','Valor Aprobado','Fecha Pago','Medio Pago','Entidad Pago','Referencia Pago','Nombre Pagador','Telefono Pagador','Comprobante URL','Comprobante ID','Comprobante Nombre','Comprobante Tipo','Comprobante Tamano','Estado Pago Reportado','Observaciones Reportante','Observaciones Tesoreria','Validado Por','Fecha Validacion','Motivo Modificacion Valor','Supera Saldo','Excedente','Activo','Fecha Registro','Fecha Actualizacion','Actualizado Por'];
  let hoja=libro.getSheetByName(HOJAS.PAGOS);
  if(!hoja){ hoja=libro.insertSheet(HOJAS.PAGOS); hoja.getRange(1,1,1,encabezados.length).setValues([encabezados]); hoja.setFrozenRows(1); }
  const carpeta=DriveApp.createFolder('Comprobantes pagos Emaús');
  PropertiesService.getScriptProperties().setProperty('CARPETA_COMPROBANTES_PAGOS_ID',carpeta.getId());
  agregarColumnasSiFaltan_(libro.getSheetByName(HOJAS.ASPIRANTES),['Tipo Registrante','Nombre Registrante','Telefono Registrante']);
  agregarColumnasSiFaltan_(libro.getSheetByName(HOJAS.CAMINANTES),['Aspirante ID','Número Inscripción','Documento Identidad','Tipo Registrante','Nombre Registrante','Telefono Registrante','Total Abonado','Saldo Pendiente','Excedente Pago']);
  asegurarParametroPago_(libro);
  asegurarRolTesoreria_(libro);
  limpiarCachePermisos();
  return {instalado:true,carpetaId:carpeta.getId(),carpetaUrl:carpeta.getUrl()};
}
function agregarColumnasSiFaltan_(hoja,nombres){ if(!hoja)return; const actuales=hoja.getRange(1,1,1,Math.max(hoja.getLastColumn(),1)).getDisplayValues()[0].map(normalizarTexto); nombres.forEach(function(n){if(!actuales.includes(normalizarTexto(n))){hoja.getRange(1,hoja.getLastColumn()+1).setValue(n);actuales.push(normalizarTexto(n));}}); }
function asegurarParametroPago_(libro){const h=libro.getSheetByName(HOJAS.CONFIGURACIONES); if(!h)return; const filas=leerHojaComoObjetos(HOJAS.CONFIGURACIONES); if(!filas.some(function(x){return normalizarTexto(x.clave)==='valor retiro actual'||normalizarTexto(x.clave)==='valor_retiro_actual';})){h.appendRow(['VALOR_RETIRO_ACTUAL','0','Número','Valor total del retiro actual','Sí']);}}
function asegurarRolTesoreria_(libro){ const hr=libro.getSheetByName(HOJAS.ROLES); if(hr&&!leerHojaComoObjetos(HOJAS.ROLES).some(function(x){return normalizarTexto(x.rol)==='tesoreria';}))hr.appendRow(['Tesorería','Validación y control de pagos del retiro.','Sí']); const hp=libro.getSheetByName(HOJAS.PERMISOS_ROL); if(hp){const actuales=leerHojaComoObjetos(HOJAS.PERMISOS_ROL);[['Tesorería','GESTIONAR_PAGOS'],['Tesorería','CONSULTAR_CAMINANTES'],['Administrador','GESTIONAR_PAGOS']].forEach(function(r){if(!actuales.some(function(x){return normalizarTexto(x.rol)===normalizarTexto(r[0])&&normalizarPermiso(x.permiso)===r[1];}))hp.appendRow([r[0],r[1],'Sí']);});}}
