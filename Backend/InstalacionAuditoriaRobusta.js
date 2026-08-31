/**
 * Ejecutar una sola vez después de desplegar la Auditoría V2.
 * Es idempotente y NO elimina la información histórica.
 */
function instalarAuditoriaRobusta() {
  const hoja =
    obtenerHoja(
      HOJAS.AUDITORIA
    );

  const columnas = [
    'Fecha',
    'Usuario',
    'Nombre',
    'Rol',
    'Acción',
    'Entidad',
    'ID Registro',
    'Resultado',
    'Detalle',
    'Datos Antes',
    'Datos Después',
    'Cambios',
    'IP',
    'Sesión ID',
    'Origen',
    'Método',
    'Ruta',
    'Duración Ms',
    'Error'
  ];

  const existentes =
    hoja
      .getRange(
        1,
        1,
        1,
        Math.max(
          hoja.getLastColumn(),
          1
        )
      )
      .getDisplayValues()[0];

  const normalizados = {};

  existentes.forEach(
    function(valor) {
      normalizados[
        normalizarTexto(
          valor
        ).replace(
          /[^a-z0-9]/g,
          ''
        )
      ] = true;
    }
  );

  const nuevas =
    columnas.filter(
      function(columna) {
        return !normalizados[
          normalizarTexto(
            columna
          ).replace(
            /[^a-z0-9]/g,
            ''
          )
        ];
      }
    );

  if (
    nuevas.length
  ) {
    const inicio =
      hoja.getLastColumn() +
      1;

    hoja
      .getRange(
        1,
        inicio,
        1,
        nuevas.length
      )
      .setValues(
        [nuevas]
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
  }

  hoja.setFrozenRows(1);

  SpreadsheetApp.flush();

  return {
    columnasAgregadas:
      nuevas,
    totalColumnas:
      hoja.getLastColumn(),
    mensaje:
      'Auditoría robusta instalada sin eliminar registros históricos.'
  };
}
