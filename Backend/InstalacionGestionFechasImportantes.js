/**
 * Instala o actualiza la gestión de Fechas importantes.
 * Ejecutar una sola vez: instalarGestionFechasImportantes()
 */
function instalarGestionFechasImportantes() {
  const libro = obtenerLibro();
  let hoja = libro.getSheetByName(HOJAS.FECHAS_IMPORTANTES);
  if (!hoja) hoja = libro.insertSheet(HOJAS.FECHAS_IMPORTANTES);

  const encabezadosObjetivo = [
    'Fecha', 'Descripción', 'ID', 'Activo',
    'CreadoEn', 'CreadoPor', 'ActualizadoEn', 'ActualizadoPor'
  ];

  if (hoja.getLastRow() === 0) hoja.appendRow(encabezadosObjetivo);

  const actuales = hoja.getRange(1, 1, 1, Math.max(hoja.getLastColumn(), 2)).getValues()[0];
  const normalizados = actuales.map(convertirEncabezado);

  encabezadosObjetivo.forEach(function(encabezado) {
    if (normalizados.indexOf(convertirEncabezado(encabezado)) < 0) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado);
      normalizados.push(convertirEncabezado(encabezado));
    }
  });

  const encabezadosFinales = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(convertirEncabezado);
  const indiceId = encabezadosFinales.indexOf('id') + 1;
  const indiceActivo = encabezadosFinales.indexOf('activo') + 1;
  const indiceCreadoEn = encabezadosFinales.indexOf('creadoen') + 1;

  if (hoja.getLastRow() > 1) {
    for (var fila = 2; fila <= hoja.getLastRow(); fila += 1) {
      const fecha = hoja.getRange(fila, 1).getValue();
      const descripcion = String(hoja.getRange(fila, 2).getValue() || '').trim();
      if (!fecha && !descripcion) continue;
      if (!String(hoja.getRange(fila, indiceId).getValue() || '').trim()) hoja.getRange(fila, indiceId).setValue(Utilities.getUuid());
      if (!String(hoja.getRange(fila, indiceActivo).getValue() || '').trim()) hoja.getRange(fila, indiceActivo).setValue('Sí');
      if (!hoja.getRange(fila, indiceCreadoEn).getValue()) hoja.getRange(fila, indiceCreadoEn).setValue(new Date());
    }
  }

  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, hoja.getLastColumn())
    .setFontWeight('bold')
    .setBackground('#14532d')
    .setFontColor('#ffffff');
  hoja.getRange('A:A').setNumberFormat('dd/mm/yyyy');
  hoja.getRange('E:E').setNumberFormat('dd/mm/yyyy hh:mm');
  hoja.getRange('G:G').setNumberFormat('dd/mm/yyyy hh:mm');
  hoja.setColumnWidth(1, 125);
  hoja.setColumnWidth(2, 420);

  configurarPermisoGestionFechasImportantes_();
  SpreadsheetApp.flush();

  return {
    instalado: true,
    hoja: HOJAS.FECHAS_IMPORTANTES,
    permiso: 'FECHAS_IMPORTANTES_GESTIONAR',
    rolesIniciales: ['ADMIN', 'LIDER_RETIRO']
  };
}

function configurarPermisoGestionFechasImportantes_() {
  const hoja = obtenerHoja(HOJAS.PERMISOS_ROL);
  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(convertirEncabezado);
  const iRol = encabezados.indexOf('rol');
  const iPermiso = encabezados.indexOf('permiso');
  const iActivo = encabezados.indexOf('activo');
  if (iRol < 0 || iPermiso < 0 || iActivo < 0) {
    throw crearErrorAplicacion('PERMISOS_ESTRUCTURA_INVALIDA', 'La hoja PermisosRol debe contener Rol, Permiso y Activo.');
  }

  const roles = ['ADMIN', 'AUDIOVISUAL', 'LIDER_RETIRO', 'LIDER_MESA', 'SERVIDOR', 'REGISTRO', 'TESORERIA', 'CAMPANERO'];
  const permitidos = ['ADMIN', 'LIDER_RETIRO'];
  roles.forEach(function(rol) {
    let filaEncontrada = -1;
    for (var i = 1; i < datos.length; i += 1) {
      if (normalizarCodigoRol_(datos[i][iRol]) === normalizarCodigoRol_(rol) && normalizarPermiso(datos[i][iPermiso]) === 'FECHAS_IMPORTANTES_GESTIONAR') {
        filaEncontrada = i + 1;
        break;
      }
    }
    const activo = permitidos.indexOf(rol) >= 0 ? 'Sí' : 'No';
    if (filaEncontrada > 0) hoja.getRange(filaEncontrada, iActivo + 1).setValue(activo);
    else hoja.appendRow([rol, 'FECHAS_IMPORTANTES_GESTIONAR', activo]);
  });
  limpiarCachePermisos();
}
