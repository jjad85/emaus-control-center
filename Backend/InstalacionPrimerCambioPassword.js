/**
 * Agrega la columna requerida para el primer cambio de contraseña.
 *
 * Ejecutar una sola vez desde Apps Script:
 * instalarPrimerCambioPassword()
 *
 * Los usuarios que ya existían quedan en "No" para no obligarlos
 * retroactivamente. Para todo usuario nuevo, registrar "Sí" en la
 * columna "Debe Cambiar Password".
 */
function instalarPrimerCambioPassword() {
  const hoja =
    obtenerHoja(
      HOJAS.USUARIOS
    );

  let encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0];

  let indiceColumna =
    encabezados
      .map(
        normalizarEncabezadoSeguridad_
      )
      .indexOf(
        'debecambiarpassword'
      );

  if (indiceColumna === -1) {
    indiceColumna =
      hoja.getLastColumn();

    hoja
      .getRange(
        1,
        indiceColumna + 1
      )
      .setValue(
        'Debe Cambiar Password'
      );
  }

  if (hoja.getLastRow() >= 2) {
    const rango =
      hoja.getRange(
        2,
        indiceColumna + 1,
        hoja.getLastRow() - 1,
        1
      );

    const valores =
      rango.getValues();

    rango.setValues(
      valores.map(
        function(fila) {
          return [
            fila[0] === '' ||
            fila[0] === null
              ? 'No'
              : fila[0]
          ];
        }
      )
    );
  }

  hoja.setFrozenRows(1);

  return {
    instalado: true,
    columna:
      'Debe Cambiar Password',
    mensaje:
      'La función de primer cambio de contraseña quedó instalada.'
  };
}
