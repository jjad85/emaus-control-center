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
      'Minutograma instalado correctamente.'
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
      'CONSULTAR_MINUTOGRAMA',
      'Sí'
    ],
    [
      'Administrador',
      'REGISTRAR_ACTIVIDAD_MINUTOGRAMA',
      'Sí'
    ],
    [
      'Administrador',
      'EDITAR_ACTIVIDAD_MINUTOGRAMA',
      'Sí'
    ],
    [
      'Administrador',
      'ACTUALIZAR_ESTADO_MINUTOGRAMA',
      'Sí'
    ],
    [
      'Administrador',
      'ELIMINAR_ACTIVIDAD_MINUTOGRAMA',
      'Sí'
    ],
    [
      'Logística',
      'CONSULTAR_MINUTOGRAMA',
      'Sí'
    ],
    [
      'Logística',
      'ACTUALIZAR_ESTADO_MINUTOGRAMA',
      'Sí'
    ],
    [
      'Registro',
      'CONSULTAR_MINUTOGRAMA',
      'Sí'
    ],
    [
      'Tesorería',
      'CONSULTAR_MINUTOGRAMA',
      'Sí'
    ],
    [
      'Entregables',
      'CONSULTAR_MINUTOGRAMA',
      'Sí'
    ],
    [
      'Consulta',
      'CONSULTAR_MINUTOGRAMA',
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
