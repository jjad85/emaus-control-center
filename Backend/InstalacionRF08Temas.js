/** Instala RF-08 sin borrar datos ni permisos existentes. */
function instalarRF08MejorasGestionTemas() {
  const libro = obtenerLibro();
  const hoja = libro.getSheetByName(HOJAS.TEMAS);
  if (!hoja) throw new Error('No existe la hoja Temas. Ejecute instalarModuloTemas().');
  const columnas = [
    'Tiene Canción Estándar','Canción Documento ID','Canción Documento Nombre','Usa Canción Estándar',
    'Tiene Video Estándar','Video Documento ID','Video Documento Nombre','Usa Video Estándar',
    'Requiere Palanca','Palanca Nombre','Palanca Instrucciones','Palanca Estado',
    'Palanca Aprobada Logística Por','Palanca Fecha Aprobación Logística'
  ];
  const actuales = hoja.getRange(1,1,1,hoja.getLastColumn()).getDisplayValues()[0];
  columnas.forEach(function(c){ if (actuales.indexOf(c) < 0) { hoja.getRange(1,hoja.getLastColumn()+1).setValue(c); actuales.push(c); } });
  const permisos = [
    ['DOCUMENTOS_CONSULTAR','Logística','Documentos','Consultar'],
    ['DOCUMENTOS_CREAR','Logística','Documentos','Crear'],
    ['DOCUMENTOS_EDITAR','Logística','Documentos','Editar'],
    ['DOCUMENTOS_ELIMINAR','Logística','Documentos','Eliminar'],
    ['DOCUMENTOS_DESCARGAR','Logística','Documentos','Descargar'],
    ['TEMAS_CONFIGURAR_MULTIMEDIA','Operación del retiro','Temas','Configurar canción y video estándar'],
    ['TEMAS_CONFIGURAR_PALANCAS','Operación del retiro','Temas','Configurar palanca'],
    ['TEMAS_ASIGNAR_MULTIMEDIA','Mi menú','Mis temas','Decidir uso de multimedia estándar'],
    ['TEMAS_GESTIONAR_PALANCAS','Logística','Palancas','Gestionar flujo logístico'],
    ['PALANCAS_APROBAR_LOGISTICA','Logística','Palancas','Aprobar entrega a Logística']
  ];
  const roles = leerHojaComoObjetos(HOJAS.ROLES).map(function(x){return x.rol;}).filter(String);
  const pr = libro.getSheetByName(HOJAS.PERMISOS_ROL);
  const existentes = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  permisos.forEach(function(p){
    roles.forEach(function(rol){
      const existe = existentes.some(function(x){return normalizarTexto(x.rol)===normalizarTexto(rol)&&normalizarPermiso(x.permiso)===p[0];});
      if (!existe) {
        const activo = normalizarTexto(rol)==='admin' || (p[0].indexOf('DOCUMENTOS_')===0 && ['lider retiro','logistica'].indexOf(normalizarTexto(rol))>=0) || (p[0]==='TEMAS_ASIGNAR_MULTIMEDIA' && normalizarTexto(rol)==='servidor') || (p[0].indexOf('PALANCAS_')>=0 && normalizarTexto(rol)==='logistica');
        pr.appendRow([rol,p[0],activo?'Sí':'No']);
      }
    });
  });
  limpiarCachePermisos(); SpreadsheetApp.flush();
  return {instalado:true,columnas:columnas.length,permisos:permisos.map(function(x){return x[0];})};
}
