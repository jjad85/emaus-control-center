/**
 * Crea la hoja necesaria para las inscripciones públicas de Angelitos.
 * Ejecutar una sola vez por ambiente.
 */
function instalarModuloAngelitos() {
  const libro = obtenerLibro();
  const nombreHoja = 'Angelitos';
  const encabezados = [
    'id',
    'nombreCompleto',
    'documento',
    'celular',
    'correo',
    'realizoEmaus',
    'parroquiaEmaus',
    'ciudadEmaus',
    'paisEmaus',
    'anioEmaus',
    'diaServicio',
    'tipoTransporte',
    'vaEnVehiculo',
    'tieneCupoLibre',
    'deseaLlevarAlguien',
    'cuposDisponibles',
    'lugarSalida',
    'horaSalida',
    'observaciones',
    'validacionEmaus',
    'estadoInscripcion',
    'origenRegistro',
    'aceptaDeclaracion',
    'activo',
    'fechaRegistro',
    'fechaActualizacion',
    'actualizadoPor'
  ];

  let hoja = libro.getSheetByName(nombreHoja);
  if (!hoja) {
    hoja = libro.insertSheet(nombreHoja);
  }

  const ultimaColumna = Math.max(hoja.getLastColumn(), 1);
  const actuales = hoja.getLastRow() > 0
    ? hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0]
    : [];

  encabezados.forEach(function(encabezado) {
    if (actuales.indexOf(encabezado) < 0) {
      const columna = hoja.getLastColumn() + 1;
      hoja.getRange(1, columna).setValue(encabezado);
      actuales.push(encabezado);
    }
  });

  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, hoja.getLastColumn())
    .setFontWeight('bold')
    .setBackground('#174b40')
    .setFontColor('#ffffff');

  hoja.autoResizeColumns(1, hoja.getLastColumn());

  return {
    instalada: true,
    hoja: nombreHoja,
    columnas: encabezados.length
  };
}
