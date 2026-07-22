/**
 * ============================================================
 * INSTALACIÓN DEL MINUTOGRAMA
 * ============================================================
 */

function instalarMinutograma() {
  const libro =
    obtenerLibro();

  let hoja =
    libro.getSheetByName(
      HOJAS.MINUTOGRAMA
    );

  if (!hoja) {
    hoja =
      libro.insertSheet(
        HOJAS.MINUTOGRAMA
      );
  }

  if (
    hoja.getLastRow() === 0
  ) {
    const encabezados = [
      'ID',
      'Orden',
      'Día',
      'Hora Inicio',
      'Duración Minutos',
      'Actividad',
      'Responsable',
      'Equipo',
      'Lugar',
      'Estado',
      'Prioridad',
      'Observaciones',
      'Activo',
      'Fecha Registro',
      'Fecha Actualización',
      'Actualizado Por'
    ];

    hoja
      .getRange(
        1,
        1,
        1,
        encabezados.length
      )
      .setValues([
        encabezados
      ]);

    hoja
      .getRange(
        1,
        1,
        1,
        encabezados.length
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

    hoja.setFrozenRows(1);

    hoja.setColumnWidth(
      1,
      70
    );

    hoja.setColumnWidth(
      2,
      70
    );

    hoja.setColumnWidth(
      3,
      110
    );

    hoja.setColumnWidth(
      4,
      110
    );

    hoja.setColumnWidth(
      5,
      130
    );

    hoja.setColumnWidth(
      6,
      280
    );

    hoja.setColumnWidth(
      7,
      180
    );

    hoja.setColumnWidth(
      8,
      160
    );

    hoja.setColumnWidth(
      9,
      160
    );

    hoja.setColumnWidth(
      10,
      120
    );

    hoja.setColumnWidth(
      11,
      100
    );

    hoja.setColumnWidth(
      12,
      280
    );
  }

  instalarPermisosMinutograma();

  return {
    hoja:
      HOJAS.MINUTOGRAMA,
    mensaje:
      'Paso a paso instalado correctamente.'
  };
}

function instalarPermisosMinutograma() {
  const hoja =
    obtenerHoja(
      HOJAS.PERMISOS_ROL
    );

  const existentes =
    leerHojaComoObjetos(
      HOJAS.PERMISOS_ROL
    );

  const permisos = [
    [
      'Administrador',
      'CONSULTAR_PASO_A_PASO',
      'Sí'
    ],
    [
      'Administrador',
      'REGISTRAR_ACTIVIDAD_PASO_A_PASO',
      'Sí'
    ],
    [
      'Administrador',
      'EDITAR_ACTIVIDAD_PASO_A_PASO',
      'Sí'
    ],
    [
      'Administrador',
      'ACTUALIZAR_ESTADO_PASO_A_PASO',
      'Sí'
    ],
    [
      'Administrador',
      'ELIMINAR_ACTIVIDAD_PASO_A_PASO',
      'Sí'
    ],
    [
      'Logística',
      'CONSULTAR_PASO_A_PASO',
      'Sí'
    ],
    [
      'Logística',
      'ACTUALIZAR_ESTADO_PASO_A_PASO',
      'Sí'
    ],
    [
      'Registro',
      'CONSULTAR_PASO_A_PASO',
      'Sí'
    ],
    [
      'Tesorería',
      'CONSULTAR_PASO_A_PASO',
      'Sí'
    ],
    [
      'Entregables',
      'CONSULTAR_PASO_A_PASO',
      'Sí'
    ],
    [
      'Consulta',
      'CONSULTAR_PASO_A_PASO',
      'Sí'
    ]
  ];

  const nuevas =
    permisos.filter(
      function(item) {
        return !existentes.some(
          function(existente) {
            return (
              normalizarTexto(
                existente.rol
              ) ===
                normalizarTexto(
                  item[0]
                ) &&
              normalizarTexto(
                existente.permiso
              ) ===
                normalizarTexto(
                  item[1]
                )
            );
          }
        );
      }
    );

  if (nuevas.length > 0) {
    hoja
      .getRange(
        hoja.getLastRow() + 1,
        1,
        nuevas.length,
        3
      )
      .setValues(
        nuevas
      );
  }

  limpiarCachePermisos();

  return {
    agregados:
      nuevas.length
  };
}
