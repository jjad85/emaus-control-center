/**
 * Instala la biblioteca documental y sus permisos.
 * Ejecutar una sola vez: instalarBibliotecaDocumental()
 */
function instalarBibliotecaDocumental() {
  const libro = obtenerLibro();
  let hoja = libro.getSheetByName(HOJAS.DOCUMENTOS);
  if (!hoja) hoja = libro.insertSheet(HOJAS.DOCUMENTOS);

  const encabezados = [
    'ID', 'Nombre', 'Descripción', 'Categoría', 'Etiquetas',
    'Asociado A Tema', 'Tema ID', 'Tema Nombre', 'Es Importante',
    'Nombre Archivo', 'Mime Type', 'Archivo Drive ID', 'Archivo Drive URL',
    'Activo', 'Creado En', 'Creado Por', 'Actualizado En', 'Actualizado Por'
  ];

  if (hoja.getLastRow() === 0) hoja.appendRow(encabezados);
  const actuales = hoja.getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 1)).getValues()[0].map(convertirEncabezado);
  encabezados.forEach(function(encabezado) {
    if (actuales.indexOf(convertirEncabezado(encabezado)) < 0) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
      actuales.push(convertirEncabezado(encabezado));
    }
  });

  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, hoja.getLastColumn()).setFontWeight('bold').setBackground('#14532d').setFontColor('#ffffff');
  hoja.getRange('O:O').setNumberFormat('dd/mm/yyyy hh:mm');
  hoja.getRange('Q:Q').setNumberFormat('dd/mm/yyyy hh:mm');
  hoja.setColumnWidth(2, 240);
  hoja.setColumnWidth(3, 360);
  hoja.setColumnWidth(4, 140);
  hoja.setColumnWidth(6, 260);

  const carpeta = obtenerCarpetaDocumentos_();
  configurarPermisosBibliotecaDocumental_();
  SpreadsheetApp.flush();

  return {
    instalado: true,
    hoja: HOJAS.DOCUMENTOS,
    carpetaDriveId: carpeta.getId(),
    permisos: [
      'DOCUMENTOS_CONSULTAR', 'DOCUMENTOS_CREAR', 'DOCUMENTOS_EDITAR',
      'DOCUMENTOS_ELIMINAR', 'DOCUMENTOS_DESCARGAR'
    ]
  };
}

function configurarPermisosBibliotecaDocumental_() {
  const hoja = obtenerHoja(HOJAS.PERMISOS_ROL);
  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(convertirEncabezado);
  const iRol = encabezados.indexOf('rol');
  const iPermiso = encabezados.indexOf('permiso');
  const iActivo = encabezados.indexOf('activo');
  if (iRol < 0 || iPermiso < 0 || iActivo < 0) throw new Error('PermisosRol debe contener Rol, Permiso y Activo.');

  const roles = ['ADMIN', 'AUDIOVISUAL', 'LIDER_RETIRO', 'LIDER_MESA', 'SERVIDOR', 'REGISTRO', 'TESORERIA', 'CAMPANERO', 'LOGISTICA'];
  const permisos = [
    'DOCUMENTOS_CONSULTAR', 'DOCUMENTOS_CREAR', 'DOCUMENTOS_EDITAR',
    'DOCUMENTOS_ELIMINAR', 'DOCUMENTOS_DESCARGAR'
  ];

  roles.forEach(function(rol) {
    permisos.forEach(function(permiso) {
      const rolCodigo = normalizarCodigoRol_(rol);
      const activo = permiso === 'DOCUMENTOS_CONSULTAR' || permiso === 'DOCUMENTOS_DESCARGAR'
        ? 'Sí'
        : (rolCodigo === 'admin' || rolCodigo === 'lider_retiro' ? 'Sí' : 'No');
      let fila = -1;
      for (var i = 1; i < datos.length; i += 1) {
        if (normalizarCodigoRol_(datos[i][iRol]) === rolCodigo && normalizarPermiso(datos[i][iPermiso]) === permiso) {
          fila = i + 1;
          break;
        }
      }
      if (fila > 0) hoja.getRange(fila, iActivo + 1).setValue(activo);
      else hoja.appendRow([rol, permiso, activo]);
    });
  });
  limpiarCachePermisos();
}
