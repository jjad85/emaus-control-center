/**
 * Ejecutar una sola vez.
 *
 * Completa la hoja Habitaciones con:
 * - ID
 * - Habitación
 * - Capacidad
 * - Bloque
 * - Piso
 * - Observaciones
 * - Estado
 * - Activo
 * - Fecha Registro
 * - Fecha Actualización
 * - Actualizado Por
 */
function instalarAdministracionHabitaciones() {
  var libro = obtenerLibro();
  var hoja =
    libro.getSheetByName(
      HOJAS.HABITACIONES
    );

  if (!hoja) {
    hoja =
      libro.insertSheet(
        HOJAS.HABITACIONES
      );
  }

  var columnas = [
    'ID',
    'Habitación',
    'Capacidad',
    'Bloque',
    'Piso',
    'Observaciones',
    'Estado',
    'Activo',
    'Fecha Registro',
    'Fecha Actualización',
    'Actualizado Por'
  ];

  var existentes =
    hoja.getLastColumn()
      ? hoja
          .getRange(
            1,
            1,
            1,
            hoja.getLastColumn()
          )
          .getDisplayValues()[0]
      : [];

  columnas.forEach(
    function(columna) {
      var existe =
        existentes.some(
          function(actual) {
            return (
              normalizarTexto(actual) ===
              normalizarTexto(columna)
            );
          }
        );

      if (!existe) {
        hoja
          .getRange(
            1,
            hoja.getLastColumn() + 1
          )
          .setValue(columna);

        existentes.push(columna);
      }
    }
  );

  var encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor || '')
          .trim()
          .normalize('NFD')
          .replace(
            /[\u0300-\u036f]/g,
            ''
          )
          .replace(
            /[^A-Za-z0-9]+(.)/g,
            function(_, letra) {
              return letra.toUpperCase();
            }
          )
          .replace(
            /^./,
            function(letra) {
              return letra.toLowerCase();
            }
          );
      });

  var indiceId =
    encabezados.indexOf('id');

  var indiceHabitacion =
    encabezados.indexOf(
      'habitacion'
    );

  var indiceCapacidad =
    encabezados.indexOf(
      'capacidad'
    );

  var indiceBloque =
    encabezados.indexOf('bloque');

  var indiceEstado =
    encabezados.indexOf('estado');

  var indiceActivo =
    encabezados.indexOf('activo');

  if (hoja.getLastRow() >= 2) {
    var valores =
      hoja
        .getRange(
          2,
          1,
          hoja.getLastRow() - 1,
          hoja.getLastColumn()
        )
        .getValues();

    valores.forEach(
      function(fila) {
        if (
          indiceId >= 0 &&
          !String(
            fila[indiceId] || ''
          ).trim()
        ) {
          fila[indiceId] =
            'HAB-' +
            Utilities
              .getUuid()
              .replace(/-/g, '')
              .slice(0, 12)
              .toUpperCase();
        }

        if (
          indiceCapacidad >= 0 &&
          !fila[indiceCapacidad]
        ) {
          fila[indiceCapacidad] = 1;
        }

        if (
          indiceBloque >= 0 &&
          !String(
            fila[indiceBloque] || ''
          ).trim()
        ) {
          fila[indiceBloque] =
            'Sin bloque';
        }

        if (
          indiceEstado >= 0 &&
          !String(
            fila[indiceEstado] || ''
          ).trim()
        ) {
          fila[indiceEstado] = 'Sí';
        }

        if (
          indiceActivo >= 0 &&
          !String(
            fila[indiceActivo] || ''
          ).trim()
        ) {
          fila[indiceActivo] = 'Sí';
        }
      }
    );

    hoja
      .getRange(
        2,
        1,
        valores.length,
        hoja.getLastColumn()
      )
      .setValues(valores);
  }

  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(
    1,
    hoja.getLastColumn()
  );

  SpreadsheetApp.flush();

  return {
    instalado: true,
    hoja:
      hoja.getName(),
    mensaje:
      'Administración de habitaciones instalada correctamente.'
  };
}
