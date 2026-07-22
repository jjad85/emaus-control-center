/**
 * Ejecutar una sola vez.
 *
 * Corrige las validaciones de la hoja Configuraciones:
 * - Activo: lista SI / NO.
 * - Nombre Visible: sin validación de lista.
 */
function repararValidacionesConfiguraciones() {
  var hoja =
    obtenerHoja(
      HOJAS.CONFIGURACIONES
    );

  var ultimaColumna =
    hoja.getLastColumn();

  var ultimaFila =
    Math.max(
      hoja.getLastRow(),
      2
    );

  var encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        ultimaColumna
      )
      .getDisplayValues()[0]
      .map(function(valor) {
        return normalizarTexto(valor);
      });

  var indiceActivo =
    encabezados.indexOf('activo');

  var indiceNombreVisible =
    encabezados.indexOf(
      'nombre visible'
    );

  if (indiceNombreVisible < 0) {
    indiceNombreVisible =
      encabezados.indexOf(
        'nombrevisible'
      );
  }

  if (indiceActivo < 0) {
    throw new Error(
      'No se encontró la columna Activo.'
    );
  }

  if (indiceNombreVisible < 0) {
    throw new Error(
      'No se encontró la columna Nombre Visible.'
    );
  }

  var cantidadFilas =
    Math.max(
      ultimaFila - 1,
      1
    );

  /*
   * Nombre Visible admite texto libre.
   */
  hoja
    .getRange(
      2,
      indiceNombreVisible + 1,
      cantidadFilas,
      1
    )
    .clearDataValidations();

  /*
   * Activo usa exactamente SI / NO.
   */
  var reglaActivo =
    SpreadsheetApp
      .newDataValidation()
      .requireValueInList(
        ['SI', 'NO'],
        true
      )
      .setAllowInvalid(false)
      .build();

  hoja
    .getRange(
      2,
      indiceActivo + 1,
      cantidadFilas,
      1
    )
    .setDataValidation(
      reglaActivo
    );

  /*
   * Normaliza valores existentes para que cumplan la lista.
   */
  var rangoActivo =
    hoja.getRange(
      2,
      indiceActivo + 1,
      cantidadFilas,
      1
    );

  var valoresActivo =
    rangoActivo.getValues();

  valoresActivo =
    valoresActivo.map(
      function(fila) {
        return [
          convertirBooleano(
            fila[0]
          )
            ? 'SI'
            : 'NO'
        ];
      }
    );

  rangoActivo.setValues(
    valoresActivo
  );

  SpreadsheetApp.flush();

  return {
    reparado: true,
    columnaActivo:
      indiceActivo + 1,
    columnaNombreVisible:
      indiceNombreVisible + 1,
    mensaje:
      'Validaciones de Configuraciones corregidas.'
  };
}
