function instalarModuloPagos() {
  const libro = obtenerLibro();
  const encabezados = ['ID','Tipo Persona','Caminante ID','Servidor ID','Retiro ID','Valor Reportado','Valor Aprobado','Fecha Pago','Medio Pago','Entidad Pago','Referencia Pago','Nombre Pagador','Telefono Pagador','Comprobante URL','Comprobante ID','Comprobante Nombre','Comprobante Tipo','Comprobante Tamano','Estado Pago Reportado','Observaciones Reportante','Observaciones Tesoreria','Validado Por','Fecha Validacion','Motivo Modificacion Valor','Supera Saldo','Excedente','Activo','Fecha Registro','Fecha Actualizacion','Actualizado Por'];
  let hoja = libro.getSheetByName(HOJAS.PAGOS);
  if (!hoja) {
    hoja = libro.insertSheet(HOJAS.PAGOS);
    hoja.getRange(1,1,1,encabezados.length).setValues([encabezados]);
    hoja.setFrozenRows(1);
  } else {
    agregarColumnasSiFaltan_(hoja, encabezados);
  }

  const props = PropertiesService.getScriptProperties();
  let carpetaId = props.getProperty('CARPETA_COMPROBANTES_PAGOS_ID');
  let carpeta;
  if (carpetaId) {
    carpeta = DriveApp.getFolderById(carpetaId);
  } else {
    carpeta = DriveApp.createFolder('Comprobantes pagos Emaús');
    carpetaId = carpeta.getId();
    props.setProperty('CARPETA_COMPROBANTES_PAGOS_ID', carpetaId);
  }

  agregarColumnasSiFaltan_(libro.getSheetByName(HOJAS.ASPIRANTES),['Tipo Registrante','Nombre Registrante','Telefono Registrante']);
  agregarColumnasSiFaltan_(libro.getSheetByName(HOJAS.CAMINANTES),['Aspirante ID','Número Inscripción','Documento Identidad','Tipo Registrante','Nombre Registrante','Telefono Registrante','Total Abonado','Saldo Pendiente','Excedente Pago']);
  agregarColumnasSiFaltan_(libro.getSheetByName(HOJAS.SERVIDORES),['Total Abonado','Saldo Pendiente','Excedente Pago']);
  asegurarParametrosPago_(libro);
  asegurarRolTesoreria_(libro);
  limpiarCachePermisos();
  return {instalado:true,carpetaId:carpetaId,carpetaUrl:carpeta.getUrl()};
}
function agregarColumnasSiFaltan_(hoja,nombres){ if(!hoja)return; const actuales=hoja.getRange(1,1,1,Math.max(hoja.getLastColumn(),1)).getDisplayValues()[0].map(normalizarTexto); nombres.forEach(function(n){if(!actuales.includes(normalizarTexto(n))){hoja.getRange(1,hoja.getLastColumn()+1).setValue(n);actuales.push(normalizarTexto(n));}}); }
function asegurarParametrosPago_(libro) {
  asegurarParametroConfiguracionPago_(libro, {
    clave: 'VALOR_RETIRO_ACTUAL',
    nombreVisible: 'Valor del retiro para caminantes',
    valor: '0',
    tipo: 'Número',
    descripcion: 'Valor individual del retiro para cada caminante.',
    activo: 'Sí'
  });
  asegurarParametroConfiguracionPago_(libro, {
    clave: 'VALOR_RETIRO_SERVIDOR',
    nombreVisible: 'Valor del retiro para servidores',
    valor: '0',
    tipo: 'Número',
    descripcion: 'Valor individual del retiro para cada servidor.',
    activo: 'Sí'
  });
}

function asegurarParametroConfiguracionPago_(libro, parametro) {
  const hoja = libro.getSheetByName(HOJAS.CONFIGURACIONES);
  if (!hoja) return;
  const datos = hoja.getDataRange().getDisplayValues();
  const encabezados = (datos[0] || []).map(function(valor) {
    return normalizarTexto(valor).replace(/[^a-z0-9]/g, '');
  });
  const indiceClave = encabezados.indexOf('clave');
  if (indiceClave === -1) return;
  const existe = datos.slice(1).some(function(fila) {
    return normalizarTexto(fila[indiceClave]) === normalizarTexto(parametro.clave);
  });
  if (existe) return;

  const fila = new Array(Math.max(hoja.getLastColumn(), encabezados.length)).fill('');
  const asignar = function(nombres, valor) {
    for (let i = 0; i < nombres.length; i += 1) {
      const indice = encabezados.indexOf(nombres[i]);
      if (indice >= 0) {
        fila[indice] = valor;
        return;
      }
    }
  };
  asignar(['clave'], parametro.clave);
  asignar(['nombrevisible', 'nombre', 'etiqueta'], parametro.nombreVisible);
  asignar(['valor'], parametro.valor);
  asignar(['tipo'], parametro.tipo);
  asignar(['descripcion'], parametro.descripcion);
  asignar(['activo'], parametro.activo);
  hoja.appendRow(fila);
}
function asegurarRolTesoreria_(libro){ const hr=libro.getSheetByName(HOJAS.ROLES); if(hr&&!leerHojaComoObjetos(HOJAS.ROLES).some(function(x){return normalizarTexto(x.rol)==='tesoreria';}))hr.appendRow(['Tesorería','Validación y control de pagos del retiro.','Sí']); const hp=libro.getSheetByName(HOJAS.PERMISOS_ROL); if(hp){const actuales=leerHojaComoObjetos(HOJAS.PERMISOS_ROL);[['Tesorería','GESTIONAR_PAGOS'],['Tesorería','CONSULTAR_CAMINANTES'],['Administrador','GESTIONAR_PAGOS']].forEach(function(r){if(!actuales.some(function(x){return normalizarTexto(x.rol)===normalizarTexto(r[0])&&normalizarPermiso(x.permiso)===r[1];}))hp.appendRow([r[0],r[1],'Sí']);});}}
