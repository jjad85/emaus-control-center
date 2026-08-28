/**
 * Instala el permiso para exportar el listado completo de caminantes por mesa
 * sin reinstalar toda la matriz.
 *
 * Roles:
 * - ADMIN
 * - LIDER_RETIRO
 * - LIDER_MESA
 */
function instalarPermisoExportarCaminantesMesa() {
  const libro =
    obtenerLibro();

  const hoja =
    libro.getSheetByName(
      HOJAS.PERMISOS_ROL
    );

  if (!hoja) {
    throw new Error(
      'No existe la hoja PermisosRol.'
    );
  }

  const permiso =
    'MESAS_EXPORTAR_CAMINANTES';

  const roles = [
    'ADMIN',
    'LIDER_RETIRO',
    'LIDER_MESA'
  ];

  const datos =
    hoja.getDataRange().getValues();

  if (!datos.length) {
    throw new Error(
      'La hoja PermisosRol no tiene encabezados.'
    );
  }

  const encabezados =
    datos[0].map(function(valor) {
      return normalizarTexto(valor)
        .replace(/[^a-z0-9]/g, '');
    });

  const iRol =
    encabezados.indexOf('rol');
  const iPermiso =
    encabezados.indexOf('permiso');
  const iActivo =
    encabezados.indexOf('activo');

  if (
    iRol < 0 ||
    iPermiso < 0 ||
    iActivo < 0
  ) {
    throw new Error(
      'PermisosRol no tiene las columnas rol, permiso y activo.'
    );
  }

  roles.forEach(function(rol) {
    let filaEncontrada = 0;

    for (
      let i = 1;
      i < datos.length;
      i += 1
    ) {
      if (
        normalizarCodigoRol_(
          datos[i][iRol]
        ) ===
          normalizarCodigoRol_(rol) &&
        normalizarPermiso(
          datos[i][iPermiso]
        ) === permiso
      ) {
        filaEncontrada = i + 1;
        break;
      }
    }

    if (filaEncontrada) {
      hoja
        .getRange(
          filaEncontrada,
          iActivo + 1
        )
        .setValue('Sí');

      return;
    }

    const nuevaFila =
      new Array(
        Math.max(
          hoja.getLastColumn(),
          encabezados.length
        )
      ).fill('');

    nuevaFila[iRol] = rol;
    nuevaFila[iPermiso] = permiso;
    nuevaFila[iActivo] = 'Sí';

    hoja.appendRow(nuevaFila);
    datos.push(nuevaFila);
  });

  limpiarCachePermisos();

  return {
    instalado: true,
    permiso: permiso,
    roles: roles
  };
}
