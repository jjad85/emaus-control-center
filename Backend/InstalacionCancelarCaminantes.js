/**
 * ENTREGA 6.33
 *
 * Instala la funcionalidad Cancelar Caminante.
 *
 * Ejecutar:
 * instalarCancelacionCaminantes();
 *
 * Es idempotente.
 */
function instalarCancelacionCaminantes() {
  const libro =
    obtenerLibro();

  const hojaPermisos =
    obtenerHoja(
      HOJAS.PERMISOS_ROL
    );

  const permiso =
    'CAMINANTES_CANCELAR';

  const rolesPermitidos = [
    'ADMIN',
    'LIDER_RETIRO'
  ];

  const rolesSistema = [
    'ADMIN',
    'AUDIOVISUAL',
    'LIDER_RETIRO',
    'LIDER_MESA',
    'SERVIDOR',
    'REGISTRO',
    'TESORERIA',
    'CAMPANERO',
    'LOGISTICA',
    'ANGELITOS'
  ];

  const datosPermisos =
    hojaPermisos
      .getDataRange()
      .getValues();

  const encabezadosPermisos =
    datosPermisos[0]
      .map(
        function(valor) {
          return normalizarTexto(
            valor
          ).replace(
            /[^a-z0-9]/g,
            ''
          );
        }
      );

  const colRol =
    encabezadosPermisos.indexOf(
      'rol'
    );

  const colPermiso =
    encabezadosPermisos.indexOf(
      'permiso'
    );

  const colActivo =
    encabezadosPermisos.indexOf(
      'activo'
    );

  if (
    colRol < 0 ||
    colPermiso < 0 ||
    colActivo < 0
  ) {
    throw crearErrorAplicacion(
      'PERMISOS_ESTRUCTURA_INVALIDA',
      'PermisosRol debe contener Rol, Permiso y Activo.'
    );
  }

  rolesSistema.forEach(
    function(rol) {
      let filaEncontrada =
        -1;

      for (
        let i = 1;
        i < datosPermisos.length;
        i += 1
      ) {
        if (
          normalizarTexto(
            datosPermisos[i][colRol]
          ) ===
            normalizarTexto(
              rol
            ) &&
          normalizarPermiso(
            datosPermisos[i][colPermiso]
          ) ===
            normalizarPermiso(
              permiso
            )
        ) {
          filaEncontrada =
            i + 1;
          break;
        }
      }

      const activo =
        rolesPermitidos.indexOf(
          rol
        ) >= 0
          ? 'Sí'
          : 'No';

      if (
        filaEncontrada > 0
      ) {
        hojaPermisos
          .getRange(
            filaEncontrada,
            colActivo + 1
          )
          .setValue(
            activo
          );
      } else {
        const fila =
          new Array(
            hojaPermisos.getLastColumn()
          ).fill('');

        fila[colRol] =
          rol;
        fila[colPermiso] =
          permiso;
        fila[colActivo] =
          activo;

        hojaPermisos.appendRow(
          fila
        );
      }
    }
  );

  /*
   * Asegura columnas requeridas en Caminantes.
   */
  const hojaCaminantes =
    obtenerHoja(
      HOJAS.CAMINANTES
    );

  const columnasRequeridas = [
    'Estado Participación',
    'Fecha Cancelación',
    'Motivo Cancelación'
  ];

  let encabezados =
    hojaCaminantes
      .getRange(
        1,
        1,
        1,
        hojaCaminantes.getLastColumn()
      )
      .getDisplayValues()[0];

  columnasRequeridas.forEach(
    function(columna) {
      const existe =
        encabezados.some(
          function(actual) {
            return (
              normalizarTexto(
                actual
              ) ===
              normalizarTexto(
                columna
              )
            );
          }
        );

      if (
        !existe
      ) {
        const nuevaColumna =
          hojaCaminantes
            .getLastColumn() +
          1;

        hojaCaminantes
          .getRange(
            1,
            nuevaColumna
          )
          .setValue(
            columna
          )
          .setFontWeight(
            'bold'
          )
          .setBackground(
            '#173b34'
          )
          .setFontColor(
            '#ffffff'
          );

        encabezados.push(
          columna
        );
      }
    }
  );

  /*
   * Inicializa el estado de los caminantes actuales.
   */
  const cabeceras =
    hojaCaminantes
      .getRange(
        1,
        1,
        1,
        hojaCaminantes.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(
        function(valor) {
          return normalizarTexto(
            valor
          );
        }
      );

  const indiceActivo =
    cabeceras.indexOf(
      'activo'
    );

  const indiceEstado =
    cabeceras.indexOf(
      'estado participacion'
    );

  if (
    hojaCaminantes.getLastRow() >= 2 &&
    indiceEstado >= 0
  ) {
    const filas =
      hojaCaminantes
        .getRange(
          2,
          1,
          hojaCaminantes.getLastRow() - 1,
          hojaCaminantes.getLastColumn()
        )
        .getValues();

    const estados =
      filas.map(
        function(fila) {
          const actual =
            String(
              fila[indiceEstado] ||
              ''
            ).trim();

          if (
            actual
          ) {
            return [
              actual
            ];
          }

          const activo =
            indiceActivo >= 0
              ? convertirBooleano(
                  fila[indiceActivo]
                )
              : true;

          return [
            activo
              ? 'Activo'
              : 'Cancelado'
          ];
        }
      );

    hojaCaminantes
      .getRange(
        2,
        indiceEstado + 1,
        estados.length,
        1
      )
      .setValues(
        estados
      );
  }

  limpiarCachePermisos();
  SpreadsheetApp.flush();

  return {
    instalado:
      true,
    permiso:
      permiso,
    rolesPermitidos:
      rolesPermitidos,
    columnasCaminantes:
      columnasRequeridas
  };
}
