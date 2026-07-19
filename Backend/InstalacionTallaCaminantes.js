/**
 * ============================================================
 * INSTALACIÓN DE TALLA EN CAMINANTES — CORREGIDO
 * ============================================================
 *
 * Ejecutar una sola vez:
 *
 * instalarTallaCamisetaCaminantes();
 *
 * Corrección:
 * normaliza encabezados eliminando espacios, tildes y símbolos.
 * Así reconoce:
 *
 * - Caminante ID
 * - CaminanteId
 * - caminante_id
 * - Talla Camisa
 * - tallaCamisa
 */

function instalarTallaCamisetaCaminantes() {
  const libro =
    obtenerLibro();

  const hojaCaminantes =
    libro.getSheetByName(
      HOJAS.CAMINANTES
    );

  const hojaAspirantes =
    libro.getSheetByName(
      HOJAS.ASPIRANTES
    );

  if (!hojaCaminantes) {
    throw crearErrorAplicacion(
      'HOJA_CAMINANTES_NO_EXISTE',
      'No existe la hoja Caminantes.'
    );
  }

  if (!hojaAspirantes) {
    throw crearErrorAplicacion(
      'HOJA_ASPIRANTES_NO_EXISTE',
      'No existe la hoja Aspirantes.'
    );
  }

  let encabezadosCaminantes =
    obtenerEncabezadosTalla_(
      hojaCaminantes
    );

  let indiceTallaCaminante =
    encabezadosCaminantes.indexOf(
      'tallacamiseta'
    );

  let columnaCreada = false;

  if (indiceTallaCaminante === -1) {
    const nuevaColumna =
      hojaCaminantes.getLastColumn() + 1;

    hojaCaminantes
      .getRange(
        1,
        nuevaColumna
      )
      .setValue(
        'Talla Camiseta'
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

    hojaCaminantes.setColumnWidth(
      nuevaColumna,
      130
    );

    columnaCreada = true;

    encabezadosCaminantes =
      obtenerEncabezadosTalla_(
        hojaCaminantes
      );

    indiceTallaCaminante =
      encabezadosCaminantes.indexOf(
        'tallacamiseta'
      );
  }

  const indiceIdCaminante =
    encabezadosCaminantes.indexOf(
      'id'
    );

  if (indiceIdCaminante === -1) {
    throw crearErrorAplicacion(
      'ID_CAMINANTE_NO_ENCONTRADO',
      'La hoja Caminantes no contiene la columna ID.'
    );
  }

  const encabezadosAspirantes =
    obtenerEncabezadosTalla_(
      hojaAspirantes
    );

  const indiceCaminanteId =
    encabezadosAspirantes.indexOf(
      'caminanteid'
    );

  const indiceTallaAspirante =
    encabezadosAspirantes.indexOf(
      'tallacamisa'
    );

  if (
    indiceCaminanteId === -1 ||
    indiceTallaAspirante === -1
  ) {
    throw crearErrorAplicacion(
      'COLUMNAS_ASPIRANTES_INCOMPLETAS',
      'No se encontraron las columnas Caminante ID y Talla Camisa en Aspirantes. Encabezados detectados: ' +
        encabezadosAspirantes.join(', ')
    );
  }

  const datosAspirantes =
    hojaAspirantes
      .getDataRange()
      .getValues();

  const tallaPorCaminante = {};

  for (
    let fila = 1;
    fila < datosAspirantes.length;
    fila += 1
  ) {
    const caminanteId =
      String(
        datosAspirantes[fila][
          indiceCaminanteId
        ] || ''
      ).trim();

    const talla =
      String(
        datosAspirantes[fila][
          indiceTallaAspirante
        ] || ''
      ).trim();

    if (
      caminanteId &&
      talla
    ) {
      tallaPorCaminante[
        caminanteId
      ] = talla;
    }
  }

  const datosCaminantes =
    hojaCaminantes
      .getDataRange()
      .getValues();

  let tallasMigradas = 0;

  for (
    let fila = 1;
    fila < datosCaminantes.length;
    fila += 1
  ) {
    const caminanteId =
      String(
        datosCaminantes[fila][
          indiceIdCaminante
        ] || ''
      ).trim();

    const tallaActual =
      String(
        datosCaminantes[fila][
          indiceTallaCaminante
        ] || ''
      ).trim();

    const tallaAspirante =
      tallaPorCaminante[
        caminanteId
      ];

    if (
      caminanteId &&
      !tallaActual &&
      tallaAspirante
    ) {
      hojaCaminantes
        .getRange(
          fila + 1,
          indiceTallaCaminante + 1
        )
        .setValue(
          tallaAspirante
        );

      tallasMigradas += 1;
    }
  }

  SpreadsheetApp.flush();

  const resultado = {
    columnaCreada:
      columnaCreada,

    tallasMigradas:
      tallasMigradas,

    encabezadosAspirantes:
      encabezadosAspirantes,

    encabezadosCaminantes:
      encabezadosCaminantes
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


/**
 * Normaliza encabezados para compararlos sin depender
 * de espacios, tildes, guiones o mayúsculas.
 */
function obtenerEncabezadosTalla_(
  hoja
) {
  return hoja
    .getRange(
      1,
      1,
      1,
      hoja.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(
      function(valor) {
        return normalizarEncabezadoTalla_(
          valor
        );
      }
    );
}


function normalizarEncabezadoTalla_(
  valor
) {
  return String(
    valor || ''
  )
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]/g,
      ''
    );
}
