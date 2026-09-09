/**
 * Instala el módulo de documentos de identidad.
 * Ejecutar una sola vez: instalarDocumentosIdentidad()
 */
function instalarDocumentosIdentidad() {
  const libro = obtenerLibro();
  let hoja = libro.getSheetByName(HOJAS.DOCUMENTOS_IDENTIDAD);
  if (!hoja) hoja = libro.insertSheet(HOJAS.DOCUMENTOS_IDENTIDAD);

  const encabezados = [
    'ID', 'Tipo Persona', 'Persona ID', 'Documento Identidad', 'Nombre',
    'Teléfono', 'Nombre Archivo', 'Mime Type', 'Archivo Drive ID',
    'Fecha Registro', 'Activo'
  ];

  if (hoja.getLastRow() === 0) hoja.appendRow(encabezados);

  const actuales = hoja
    .getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 1))
    .getDisplayValues()[0]
    .map(convertirEncabezado);

  encabezados.forEach(function(encabezado) {
    const clave = convertirEncabezado(encabezado);
    if (actuales.indexOf(clave) < 0) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
      actuales.push(clave);
    }
  });

  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, hoja.getLastColumn())
    .setFontWeight('bold')
    .setBackground('#14532d')
    .setFontColor('#ffffff');
  hoja.autoResizeColumns(1, hoja.getLastColumn());

  configurarPermisoDocumentosIdentidad_();
  const carpeta = obtenerCarpetaDocumentosIdentidad_();

  SpreadsheetApp.flush();

  return {
    instalado: true,
    hoja: HOJAS.DOCUMENTOS_IDENTIDAD,
    carpetaDriveId: carpeta.getId(),
    permiso: 'SISTEMA_DOCUMENTOS_IDENTIDAD_VER',
    roles: ['ADMIN', 'LIDER_RETIRO']
  };
}

function configurarPermisoDocumentosIdentidad_() {
  const hoja = obtenerHoja(HOJAS.PERMISOS_ROL);
  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(convertirEncabezado);
  const iRol = encabezados.indexOf('rol');
  const iPermiso = encabezados.indexOf('permiso');
  const iActivo = encabezados.indexOf('activo');

  if (iRol < 0 || iPermiso < 0 || iActivo < 0) {
    throw new Error('PermisosRol debe contener Rol, Permiso y Activo.');
  }

  const permiso = 'SISTEMA_DOCUMENTOS_IDENTIDAD_VER';
  ['ADMIN', 'LIDER_RETIRO'].forEach(function(rol) {
    let fila = -1;
    for (var i = 1; i < datos.length; i += 1) {
      if (
        normalizarCodigoRol_(datos[i][iRol]) === normalizarCodigoRol_(rol) &&
        normalizarPermiso(datos[i][iPermiso]) === permiso
      ) {
        fila = i + 1;
        break;
      }
    }

    if (fila > 0) {
      hoja.getRange(fila, iActivo + 1).setValue('Sí');
    } else {
      hoja.appendRow([rol, permiso, 'Sí']);
    }
  });

  limpiarCachePermisos();
}
