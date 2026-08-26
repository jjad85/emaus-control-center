function instalarPermisoEditarAspirantes() {
  const libro = obtenerLibro();
  const hoja = libro.getSheetByName(HOJAS.PERMISOS_ROL);
  if (!hoja) throw new Error('No existe PermisosRol.');

  const permiso = 'ASPIRANTES_EDITAR';
  const roles = ['ADMIN','LIDER_RETIRO','REGISTRO'];
  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(v => normalizarTexto(v).replace(/[^a-z0-9]/g,''));
  const iRol = encabezados.indexOf('rol');
  const iPermiso = encabezados.indexOf('permiso');
  const iActivo = encabezados.indexOf('activo');

  roles.forEach(function(rol) {
    let fila = 0;
    for (let i=1;i<datos.length;i+=1) {
      if (
        normalizarCodigoRol_(datos[i][iRol]) === normalizarCodigoRol_(rol) &&
        normalizarPermiso(datos[i][iPermiso]) === permiso
      ) { fila = i+1; break; }
    }

    if (fila) {
      hoja.getRange(fila, iActivo+1).setValue('Sí');
    } else {
      const nueva = new Array(Math.max(hoja.getLastColumn(), encabezados.length)).fill('');
      nueva[iRol]=rol; nueva[iPermiso]=permiso; nueva[iActivo]='Sí';
      hoja.appendRow(nueva); datos.push(nueva);
    }
  });

  limpiarCachePermisos();
  return { instalado:true, permiso, roles };
}
