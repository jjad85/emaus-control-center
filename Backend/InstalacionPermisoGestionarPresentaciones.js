/**
 * ============================================================
 * PERMISO DE AUDIOVISUALES PARA PRESENTACIONES
 * ============================================================
 *
 * Ejecutar una sola vez:
 *
 *   instalarPermisoGestionarPresentaciones()
 *
 * Crea o activa GESTIONAR_PRESENTACIONES para:
 * - Audiovisuales
 * - Administrador
 *
 * Después, el permiso puede administrarse normalmente desde
 * la matriz PermisosRol.
 */
function instalarPermisoGestionarPresentaciones() {
  const libro = obtenerLibro();
  const hoja = libro.getSheetByName(HOJAS.PERMISOS_ROL);

  if (!hoja) {
    throw new Error(
      'No existe la hoja PermisosRol. Ejecute primero la instalación de seguridad.'
    );
  }

  const valores = hoja.getDataRange().getValues();

  if (!valores.length) {
    throw new Error(
      'La hoja PermisosRol no contiene encabezados.'
    );
  }

  const encabezados = valores[0].map(function(valor) {
    return normalizarTexto(valor);
  });

  const indiceRol = encabezados.indexOf('rol');
  const indicePermiso = encabezados.indexOf('permiso');
  const indiceActivo = encabezados.indexOf('activo');

  if (
    indiceRol < 0 ||
    indicePermiso < 0 ||
    indiceActivo < 0
  ) {
    throw new Error(
      'La hoja PermisosRol debe contener las columnas Rol, Permiso y Activo.'
    );
  }

  const permiso = 'GESTIONAR_PRESENTACIONES';
  const rolesIniciales = [
    'Audiovisuales',
    'Administrador'
  ];

  const resultado = {
    permiso: permiso,
    creados: [],
    activados: [],
    rolesNoEncontrados: []
  };

  rolesIniciales.forEach(function(rolObjetivo) {
    const rolNormalizado = normalizarTexto(rolObjetivo);
    let filaRolEncontrada = '';
    let filaPermiso = 0;

    for (let i = 1; i < valores.length; i += 1) {
      const rolFila = String(
        valores[i][indiceRol] || ''
      ).trim();

      if (
        normalizarTexto(rolFila) ===
        rolNormalizado
      ) {
        filaRolEncontrada =
          filaRolEncontrada || rolFila;

        if (
          normalizarPermiso(
            valores[i][indicePermiso]
          ) === permiso
        ) {
          filaPermiso = i + 1;
          break;
        }
      }
    }

    if (!filaRolEncontrada) {
      resultado.rolesNoEncontrados.push(
        rolObjetivo
      );
      return;
    }

    if (filaPermiso) {
      hoja
        .getRange(
          filaPermiso,
          indiceActivo + 1
        )
        .setValue('Sí');

      resultado.activados.push(
        filaRolEncontrada
      );
      return;
    }

    const nuevaFila =
      new Array(
        hoja.getLastColumn()
      ).fill('');

    nuevaFila[indiceRol] =
      filaRolEncontrada;
    nuevaFila[indicePermiso] =
      permiso;
    nuevaFila[indiceActivo] =
      'Sí';

    hoja
      .getRange(
        hoja.getLastRow() + 1,
        1,
        1,
        nuevaFila.length
      )
      .setValues([nuevaFila]);

    resultado.creados.push(
      filaRolEncontrada
    );
  });

  SpreadsheetApp.flush();
  limpiarCachePermisos();

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}
