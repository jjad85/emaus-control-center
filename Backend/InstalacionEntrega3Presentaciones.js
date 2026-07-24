/**
 * ============================================================
 * INSTALACIÓN ENTREGA 3 — FLUJO COLABORATIVO DE PRESENTACIONES
 * ============================================================
 *
 * Usa la infraestructura existente del proyecto:
 * - obtenerLibro()
 * - HOJAS
 *
 * No usa getActiveSpreadsheet(), PropertiesService ni solicita
 * configurar nuevamente el ID de la hoja.
 */

function instalarEntrega3Presentaciones() {
  const libro = obtenerLibro();

  if (!libro) {
    throw new Error(
      'obtenerLibro() no devolvió el archivo principal del sistema.'
    );
  }

  const hojas = {
    TemaComentarios: [
      'ID',
      'Tema ID',
      'Versión ID',
      'Número Versión',
      'Usuario ID',
      'Usuario Nombre',
      'Rol',
      'Comentario',
      'Tipo Comentario',
      'Atendido',
      'Fecha Registro',
      'Fecha Actualización',
      'Actualizado Por'
    ],
    TemaNotificaciones: [
      'ID',
      'Tipo',
      'Título',
      'Mensaje',
      'Ruta',
      'Tema ID',
      'Versión ID',
      'Usuario Destino',
      'Servidor ID Destino',
      'Rol Destino',
      'Leída',
      'Fecha Lectura',
      'Activo',
      'Fecha Registro',
      'Fecha Actualización',
      'Actualizado Por'
    ]
  };

  const resultado = {
    instalado: true,
    hojasCreadas: [],
    hojasActualizadas: []
  };

  Object.keys(hojas).forEach(function(nombreHoja) {
    const accion = asegurarHojaEntrega3_(
      libro,
      nombreHoja,
      hojas[nombreHoja]
    );

    if (accion === 'creada') {
      resultado.hojasCreadas.push(nombreHoja);
    } else {
      resultado.hojasActualizadas.push(nombreHoja);
    }
  });

  SpreadsheetApp.flush();

  console.log(JSON.stringify(resultado, null, 2));
  return resultado;
}

function asegurarHojaEntrega3_(libro, nombreHoja, encabezados) {
  let hoja = libro.getSheetByName(nombreHoja);
  let accion = 'actualizada';

  if (!hoja) {
    hoja = libro.insertSheet(nombreHoja);
    accion = 'creada';
  }

  const encabezadosActuales =
    hoja.getLastRow() > 0 && hoja.getLastColumn() > 0
      ? hoja
          .getRange(1, 1, 1, hoja.getLastColumn())
          .getDisplayValues()[0]
          .map(function(valor) {
            return String(valor || '').trim();
          })
      : [];

  if (encabezadosActuales.length === 0) {
    hoja
      .getRange(1, 1, 1, encabezados.length)
      .setValues([encabezados]);
  } else {
    encabezados.forEach(function(encabezado) {
      if (encabezadosActuales.indexOf(encabezado) === -1) {
        const nuevaColumna = hoja.getLastColumn() + 1;
        hoja.getRange(1, nuevaColumna).setValue(encabezado);
        encabezadosActuales.push(encabezado);
      }
    });
  }

  aplicarFormatoHojaEntrega3_(hoja);
  return accion;
}

function aplicarFormatoHojaEntrega3_(hoja) {
  const columnas = Math.max(hoja.getLastColumn(), 1);

  hoja.setFrozenRows(1);

  hoja
    .getRange(1, 1, 1, columnas)
    .setFontWeight('bold')
    .setBackground('#173b34')
    .setFontColor('#ffffff');

  hoja.autoResizeColumns(1, columnas);
}
