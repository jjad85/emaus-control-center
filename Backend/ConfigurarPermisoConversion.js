/**
 * ============================================================
 * CONFIGURAR PERMISO DE CONVERSIÓN
 * ============================================================
 *
 * Ejecutar una sola vez desde Google Apps Script:
 *   configurarPermisoConversionAspirante();
 *
 * Crea el permiso CONVERTIR_ASPIRANTE para los roles
 * Administrador y Coordinador, evitando registros duplicados.
 */
function configurarPermisoConversionAspirante() {
  const roles = [
    'Administrador',
    'Coordinador'
  ];

  const permiso =
    'CONVERTIR_ASPIRANTE';

  const hoja =
    obtenerHoja(
      HOJAS.PERMISOS_ROL
    );

  const ultimaColumna =
    hoja.getLastColumn();

  if (ultimaColumna < 1) {
    throw crearErrorAplicacion(
      'PERMISOS_SIN_ENCABEZADOS',
      'La hoja PermisosRol no contiene encabezados.'
    );
  }

  const encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0];

  const indiceRol =
    buscarIndiceConfiguracionPermiso(
      encabezados,
      'rol'
    );

  const indicePermiso =
    buscarIndiceConfiguracionPermiso(
      encabezados,
      'permiso'
    );

  const indiceActivo =
    buscarIndiceConfiguracionPermiso(
      encabezados,
      'activo'
    );

  if (
    indiceRol === -1 ||
    indicePermiso === -1 ||
    indiceActivo === -1
  ) {
    throw crearErrorAplicacion(
      'PERMISOS_ENCABEZADOS_INVALIDOS',
      'La hoja PermisosRol debe contener las columnas Rol, Permiso y Activo.'
    );
  }

  const registros =
    hoja.getLastRow() > 1
      ? hoja
          .getRange(
            2,
            1,
            hoja.getLastRow() - 1,
            ultimaColumna
          )
          .getDisplayValues()
      : [];

  const creados = [];
  const existentes = [];

  roles.forEach(
    function(rol) {
      const encontrado =
        registros.some(
          function(fila) {
            return (
              normalizarTexto(
                fila[indiceRol]
              ) ===
                normalizarTexto(rol) &&
              normalizarPermiso(
                fila[indicePermiso]
              ) === permiso
            );
          }
        );

      if (encontrado) {
        existentes.push(rol);
        return;
      }

      const nuevaFila =
        encabezados.map(
          function(_, indice) {
            if (indice === indiceRol) {
              return rol;
            }

            if (indice === indicePermiso) {
              return permiso;
            }

            if (indice === indiceActivo) {
              return 'Sí';
            }

            return '';
          }
        );

      hoja.appendRow(
        nuevaFila
      );

      registros.push(
        nuevaFila
      );

      creados.push(rol);
    }
  );

  limpiarCachePermisos();

  const resultado = {
    permiso: permiso,
    rolesCreados: creados,
    rolesExistentes: existentes
  };

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}

function buscarIndiceConfiguracionPermiso(
  encabezados,
  nombre
) {
  const buscado =
    normalizarTexto(nombre)
      .replace(
        /[^a-z0-9]/g,
        ''
      );

  return encabezados.findIndex(
    function(encabezado) {
      return (
        normalizarTexto(encabezado)
          .replace(
            /[^a-z0-9]/g,
            ''
          ) === buscado
      );
    }
  );
}
