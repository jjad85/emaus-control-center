/**
 * Instala las columnas necesarias para el bloqueo de usuarios.
 *
 * Ejecutar una sola vez:
 *
 * instalarSeguridadAdministracion();
 */
function instalarSeguridadAdministracion() {
  const hoja =
    obtenerHoja(
      HOJAS.USUARIOS
    );

  const columnas = [
    'Intentos Fallidos',
    'Último Intento Fallido',
    'Bloqueado Hasta'
  ];

  let encabezados =
    hoja
      .getRange(
        1,
        1,
        1,
        hoja.getLastColumn()
      )
      .getDisplayValues()[0];

  const normalizados =
    encabezados.map(
      function(valor) {
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
    );

  const faltantes =
    columnas.filter(
      function(columna) {
        const normalizado =
          String(columna)
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

        return (
          normalizados.indexOf(
            normalizado
          ) === -1
        );
      }
    );

  if (faltantes.length) {
    hoja
      .getRange(
        1,
        hoja.getLastColumn() + 1,
        1,
        faltantes.length
      )
      .setValues([
        faltantes
      ])
      .setFontWeight(
        'bold'
      )
      .setBackground(
        '#173b34'
      )
      .setFontColor(
        '#ffffff'
      );
  }

  SpreadsheetApp.flush();

  return {
    columnasCreadas:
      faltantes
  };
}
