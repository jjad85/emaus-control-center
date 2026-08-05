/**
 * Entrega 6.3.1 — Unificación de contactos entre Aspirantes y Caminantes.
 * Ejecutar una sola vez: instalarContactosCaminantes();
 */
function instalarContactosCaminantes() {
  const libro = obtenerLibro();
  const hoja = libro.getSheetByName(HOJAS.CAMINANTES || 'Caminantes');
  if (!hoja) throw new Error('No existe la hoja Caminantes.');

  const columnas = [
    'Contacto 1 Nombre',
    'Contacto 1 Parentesco',
    'Contacto 1 Celular',
    'Contacto 2 Nombre',
    'Contacto 2 Parentesco',
    'Contacto 2 Celular'
  ];

  const ultimaColumna = Math.max(1, hoja.getLastColumn());
  const encabezados = hoja.getRange(1, 1, 1, ultimaColumna).getDisplayValues()[0];
  const normalizados = encabezados.map(function(x) { return normalizarTexto(x); });
  const agregadas = [];

  columnas.forEach(function(columna) {
    if (normalizados.indexOf(normalizarTexto(columna)) < 0) {
      hoja.getRange(1, hoja.getLastColumn() + 1).setValue(columna);
      normalizados.push(normalizarTexto(columna));
      agregadas.push(columna);
    }
  });

  const datos = hoja.getDataRange().getValues();
  if (datos.length > 1) {
    const mapa = {};
    datos[0].forEach(function(encabezado, indice) {
      mapa[normalizarTexto(encabezado)] = indice;
    });

    const idxContacto = mapa[normalizarTexto('Contacto')];
    const idxTelefono = mapa[normalizarTexto('Teléfono Contacto')];
    const idxNombre1 = mapa[normalizarTexto('Contacto 1 Nombre')];
    const idxCelular1 = mapa[normalizarTexto('Contacto 1 Celular')];

    let migradas = 0;
    for (let fila = 1; fila < datos.length; fila += 1) {
      let cambio = false;
      if (idxNombre1 !== undefined && !datos[fila][idxNombre1] && idxContacto !== undefined && datos[fila][idxContacto]) {
        datos[fila][idxNombre1] = datos[fila][idxContacto];
        cambio = true;
      }
      if (idxCelular1 !== undefined && !datos[fila][idxCelular1] && idxTelefono !== undefined && datos[fila][idxTelefono]) {
        datos[fila][idxCelular1] = datos[fila][idxTelefono];
        cambio = true;
      }
      if (cambio) migradas += 1;
    }

    if (migradas > 0) {
      hoja.getRange(1, 1, datos.length, datos[0].length).setValues(datos);
    }

    SpreadsheetApp.flush();
    return { ok: true, columnasAgregadas: agregadas, filasMigradas: migradas };
  }

  SpreadsheetApp.flush();
  return { ok: true, columnasAgregadas: agregadas, filasMigradas: 0 };
}
