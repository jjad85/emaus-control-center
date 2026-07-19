/**
 * ============================================================
 * INSTALACIÓN DE NOMBRE VISIBLE EN CONFIGURACIONES
 * ============================================================
 *
 * Ejecutar una sola vez:
 *
 * instalarNombreVisibleConfiguraciones();
 *
 * Agrega la columna "Nombre Visible" y llena automáticamente
 * las filas existentes a partir de la clave técnica.
 */
function instalarNombreVisibleConfiguraciones() {
  const hoja =
    obtenerHoja(
      HOJAS.CONFIGURACIONES
    );

  const ultimaColumna =
    hoja.getLastColumn();

  const encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0];

  const normalizados =
    encabezados.map(
      normalizarEncabezadoNombreVisible_
    );

  let indiceNombreVisible =
    normalizados.indexOf(
      'nombrevisible'
    );

  let columnaCreada = false;

  if (indiceNombreVisible === -1) {
    const nuevaColumna =
      ultimaColumna + 1;

    hoja
      .getRange(
        1,
        nuevaColumna
      )
      .setValue(
        'Nombre Visible'
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
      260
    );

    indiceNombreVisible =
      nuevaColumna - 1;

    columnaCreada = true;
  }

  const encabezadosActualizados =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(
        normalizarEncabezadoNombreVisible_
      );

  const indiceClave =
    encabezadosActualizados.indexOf(
      'clave'
    );

  indiceNombreVisible =
    encabezadosActualizados.indexOf(
      'nombrevisible'
    );

  if (
    indiceClave === -1 ||
    indiceNombreVisible === -1
  ) {
    throw crearErrorAplicacion(
      'CONFIGURACIONES_COLUMNAS_INCOMPLETAS',
      'No fue posible localizar Clave y Nombre Visible.'
    );
  }

  const ultimaFila =
    hoja.getLastRow();

  let nombresGenerados = 0;

  if (ultimaFila >= 2) {
    const datos =
      hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          hoja.getLastColumn()
        )
        .getValues();

    const valoresNombre =
      datos.map(
        function(fila) {
          const actual =
            String(
              fila[
                indiceNombreVisible
              ] || ''
            ).trim();

          if (actual) {
            return [actual];
          }

          const clave =
            String(
              fila[indiceClave] || ''
            ).trim();

          if (!clave) {
            return [''];
          }

          nombresGenerados += 1;

          return [
            humanizarClaveNombreVisible_(
              clave
            )
          ];
        }
      );

    hoja
      .getRange(
        2,
        indiceNombreVisible + 1,
        valoresNombre.length,
        1
      )
      .setValues(
        valoresNombre
      );
  }

  SpreadsheetApp.flush();
  limpiarCacheConfiguraciones();

  return {
    columnaCreada:
      columnaCreada,

    nombresGenerados:
      nombresGenerados
  };
}


function normalizarEncabezadoNombreVisible_(
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


function humanizarClaveNombreVisible_(
  clave
) {
  return String(
    clave || ''
  )
    .replace(
      /([a-z0-9])([A-Z])/g,
      '$1 $2'
    )
    .replace(
      /[_-]+/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .replace(
      /^./,
      function(letra) {
        return letra.toUpperCase();
      }
    );
}
