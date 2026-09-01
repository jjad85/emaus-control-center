/**
 * Instalador idempotente para seguimiento de llamadas del caminante.
 *
 * Agrega:
 * - Llamada Caminante
 * - Llamada Contactos
 *
 * Permisos:
 * - ADMIN
 * - LIDER_RETIRO
 * - LIDER_MESA
 */
function instalarSeguimientoLlamadasCaminantes() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const hojaCaminantes =
    ss.getSheetByName(
      HOJAS.CAMINANTES
    );

  if (!hojaCaminantes) {
    throw new Error(
      'No existe la hoja de Caminantes.'
    );
  }

  const hojaPermisos =
    ss.getSheetByName(
      'PermisosRol'
    );

  if (!hojaPermisos) {
    throw new Error(
      'No existe la hoja PermisosRol.'
    );
  }

  const permisos = [
    'CAMINANTES_REPORTAR_LLAMADA_CAMINANTE',
    'CAMINANTES_REPORTAR_LLAMADA_CONTACTOS'
  ];

  const rolesPermitidos = [
    'ADMIN',
    'LIDER_RETIRO',
    'LIDER_MESA'
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

  if (
    !datosPermisos.length
  ) {
    throw new Error(
      'La hoja PermisosRol no tiene encabezados.'
    );
  }

  function normalizarEncabezado_(
    valor
  ) {
    return String(
      valor ||
      ''
    )
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );
  }

  const encabezadosPermisos =
    datosPermisos[0].map(
      normalizarEncabezado_
    );

  const indiceRol =
    encabezadosPermisos
      .indexOf(
        'rol'
      );

  const indicePermiso =
    encabezadosPermisos
      .indexOf(
        'permiso'
      );

  const indiceActivo =
    encabezadosPermisos
      .indexOf(
        'activo'
      );

  if (
    indiceRol < 0 ||
    indicePermiso < 0 ||
    indiceActivo < 0
  ) {
    throw new Error(
      'PermisosRol debe contener Rol, Permiso y Activo.'
    );
  }

  permisos.forEach(
    function(
      permiso
    ) {
      const filasPorRol = {};

      for (
        let i = 1;
        i < datosPermisos.length;
        i++
      ) {
        const rol =
          String(
            datosPermisos[i][indiceRol] ||
            ''
          )
            .trim()
            .toUpperCase();

        const permisoFila =
          String(
            datosPermisos[i][indicePermiso] ||
            ''
          )
            .trim()
            .toUpperCase();

        if (
          permisoFila ===
          permiso
        ) {
          filasPorRol[rol] =
            i + 1;
        }
      }

      rolesSistema.forEach(
        function(
          rol
        ) {
          const activo =
            rolesPermitidos.indexOf(
              rol
            ) !== -1
              ? 'Sí'
              : 'No';

          if (
            filasPorRol[rol]
          ) {
            hojaPermisos
              .getRange(
                filasPorRol[rol],
                indiceActivo + 1
              )
              .setValue(
                activo
              );
          } else {
            const nuevaFila =
              new Array(
                encabezadosPermisos.length
              ).fill(
                ''
              );

            nuevaFila[indiceRol] =
              rol;

            nuevaFila[indicePermiso] =
              permiso;

            nuevaFila[indiceActivo] =
              activo;

            hojaPermisos
              .appendRow(
                nuevaFila
              );
          }
        }
      );
    }
  );

  function asegurarColumna_(
    nombre
  ) {
    const totalColumnas =
      Math.max(
        hojaCaminantes.getLastColumn(),
        1
      );

    const encabezados =
      hojaCaminantes
        .getRange(
          1,
          1,
          1,
          totalColumnas
        )
        .getValues()[0];

    const nombreNormalizado =
      normalizarEncabezado_(
        nombre
      );

    for (
      let i = 0;
      i < encabezados.length;
      i++
    ) {
      if (
        normalizarEncabezado_(
          encabezados[i]
        ) ===
        nombreNormalizado
      ) {
        return i + 1;
      }
    }

    const nuevaColumna =
      totalColumnas + 1;

    hojaCaminantes
      .getRange(
        1,
        nuevaColumna
      )
      .setValue(
        nombre
      )
      .setBackground(
        '#173b34'
      )
      .setFontColor(
        '#ffffff'
      )
      .setFontWeight(
        'bold'
      );

    return nuevaColumna;
  }

  const columnaLlamadaCaminante =
    asegurarColumna_(
      'Llamada Caminante'
    );

  const columnaLlamadaContactos =
    asegurarColumna_(
      'Llamada Contactos'
    );

  const ultimaFila =
    hojaCaminantes.getLastRow();

  if (
    ultimaFila > 1
  ) {
    [
      columnaLlamadaCaminante,
      columnaLlamadaContactos
    ].forEach(
      function(
        numeroColumna
      ) {
        const rango =
          hojaCaminantes
            .getRange(
              2,
              numeroColumna,
              ultimaFila - 1,
              1
            );

        const valores =
          rango
            .getValues()
            .map(
              function(
                fila
              ) {
                return [
                  String(
                    fila[0] ||
                    ''
                  ).trim() ||
                  'Pendiente'
                ];
              }
            );

        rango.setValues(
          valores
        );
      }
    );
  }

  if (
    typeof limpiarCachePermisos ===
    'function'
  ) {
    limpiarCachePermisos();
  }

  SpreadsheetApp.flush();
}
