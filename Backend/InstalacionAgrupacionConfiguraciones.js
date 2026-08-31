/**
 * ============================================================
 * INSTALACIÓN DE AGRUPACIÓN EN CONFIGURACIONES
 * ============================================================
 *
 * Ejecutar:
 *
 * instalarAgrupacionConfiguraciones();
 *
 * Es idempotente:
 * - crea la columna "Agrupación" si no existe;
 * - conserva agrupaciones diligenciadas manualmente;
 * - clasifica únicamente filas vacías;
 * - puede ejecutarse nuevamente cuando se agreguen parámetros.
 */
function instalarAgrupacionConfiguraciones() {
  const hoja =
    obtenerHoja(
      HOJAS.CONFIGURACIONES
    );

  let ultimaColumna =
    hoja.getLastColumn();

  let encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0];

  let normalizados =
    encabezados.map(
      normalizarEncabezadoAgrupacionConfiguracion_
    );

  let indiceAgrupacion =
    normalizados.indexOf(
      'agrupacion'
    );

  let columnaCreada = false;

  if (indiceAgrupacion === -1) {
    const nuevaColumna =
      ultimaColumna + 1;

    hoja
      .getRange(
        1,
        nuevaColumna
      )
      .setValue(
        'Agrupación'
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

    hoja.setColumnWidth(
      nuevaColumna,
      220
    );

    columnaCreada = true;
    ultimaColumna =
      hoja.getLastColumn();

    encabezados =
      hoja
        .getRange(
          1,
          1,
          1,
          ultimaColumna
        )
        .getDisplayValues()[0];

    normalizados =
      encabezados.map(
        normalizarEncabezadoAgrupacionConfiguracion_
      );

    indiceAgrupacion =
      normalizados.indexOf(
        'agrupacion'
      );
  }

  const indiceClave =
    normalizados.indexOf(
      'clave'
    );

  if (
    indiceClave === -1 ||
    indiceAgrupacion === -1
  ) {
    throw crearErrorAplicacion(
      'CONFIGURACIONES_AGRUPACION_ESTRUCTURA_INVALIDA',
      'No fue posible localizar las columnas Clave y Agrupación.'
    );
  }

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    return {
      columnaCreada:
        columnaCreada,
      filasClasificadas:
        0
    };
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        ultimaFila - 1,
        hoja.getLastColumn()
      )
      .getValues();

  let filasClasificadas = 0;

  const valores =
    datos.map(
      function(fila) {
        const actual =
          String(
            fila[
              indiceAgrupacion
            ] || ''
          ).trim();

        if (actual) {
          return [actual];
        }

        const clave =
          String(
            fila[
              indiceClave
            ] || ''
          ).trim();

        if (!clave) {
          return [''];
        }

        filasClasificadas += 1;

        return [
          obtenerAgrupacionConfiguracion_(
            clave
          )
        ];
      }
    );

  hoja
    .getRange(
      2,
      indiceAgrupacion + 1,
      valores.length,
      1
    )
    .setValues(
      valores
    );

  SpreadsheetApp.flush();
  limpiarCacheConfiguraciones();

  return {
    columnaCreada:
      columnaCreada,
    filasClasificadas:
      filasClasificadas,
    totalConfiguraciones:
      datos.filter(
        function(fila) {
          return String(
            fila[
              indiceClave
            ] || ''
          ).trim() !== '';
        }
      ).length
  };
}


function obtenerAgrupacionConfiguracion_(
  claveIngresada
) {
  const clave =
    String(
      claveIngresada || ''
    ).trim();

  const k =
    clave.toLowerCase();

  /*
   * Casos específicos primero. Después se aplican
   * reglas por prefijo para que parámetros futuros
   * queden organizados automáticamente.
   */

  if (
    [
      'anioRetiro',
      'tipoRetiro'
    ].indexOf(clave) >= 0
  ) {
    return 'Información del retiro';
  }

  if (
    [
      'metaCaminantes',
      'caminantesPorMesa',
      'numeroMesas'
    ].indexOf(clave) >= 0
  ) {
    return 'Cupos y organización';
  }

  if (
    clave ===
      'VALOR_RETIRO_ACTUAL' ||
    clave ===
      'VALOR_RETIRO_SERVIDOR' ||
    clave ===
      'CATEGORIAS_GASTOS' ||
    clave ===
      'whatsappMensajeRecordatorioPago'
  ) {
    return 'Pagos y tesorería';
  }

  if (
    k.indexOf(
      'vestuario'
    ) === 0
  ) {
    return 'Vestuario';
  }

  if (
    k.indexOf(
      'tema'
    ) === 0
  ) {
    return 'Apariencia y tema';
  }

  if (
    k.indexOf(
      'angelitos'
    ) === 0 ||
    k.indexOf(
      'serenata'
    ) === 0 ||
    k.indexOf(
      'campanaangelitos'
    ) === 0 ||
    k.indexOf(
      'campanaserenata'
    ) === 0
  ) {
    return 'Angelitos y Serenata';
  }

  if (
    k.indexOf(
      'whatsapp'
    ) === 0
  ) {
    return 'Mensajes y WhatsApp';
  }

  if (
    k.indexOf(
      'portalautorizacion'
    ) === 0 ||
    clave ===
      'minutosVigenciaEnlaceAutorizaciones'
  ) {
    return 'Autorizaciones y documentos';
  }

  if (
    clave ===
      'urlPlantillaPresentacionTemas'
  ) {
    return 'Documentos y contenidos';
  }

  if (
    k.indexOf(
      'portal'
    ) === 0
  ) {
    return 'Portal público';
  }

  if (
    k.indexOf(
      'sistema'
    ) === 0 ||
    clave ===
      'duracionSesionSegundos' ||
    clave ===
      'urlBaseAplicacion'
  ) {
    return 'Sistema';
  }

  return 'Otros';
}


function normalizarEncabezadoAgrupacionConfiguracion_(
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
