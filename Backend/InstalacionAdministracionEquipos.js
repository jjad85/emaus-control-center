/**
 * Ejecutar una sola vez.
 *
 * Crea o completa:
 * - Equipos
 * - ServidorEquipos
 *
 * También migra como equipos principales los nombres actualmente
 * utilizados en la columna Equipo de la hoja Servidores.
 */
function instalarAdministracionEquipos() {
  var libro = obtenerLibro();

  var hojaEquipos = obtenerOCrearHojaEquipos_(
    libro,
    'Equipos',
    [
      'ID',
      'Nombre',
      'Tipo',
      'Descripción',
      'Orden',
      'Activo',
      'Fecha Registro',
      'Fecha Actualización',
      'Actualizado Por'
    ]
  );

  var hojaServidorEquipos = obtenerOCrearHojaEquipos_(
    libro,
    'ServidorEquipos',
    [
      'ID',
      'Servidor ID',
      'Servidor Nombre',
      'Equipo ID',
      'Tipo Asignación',
      'Activo',
      'Fecha Inicio',
      'Fecha Fin',
      'Fecha Registro',
      'Fecha Actualización',
      'Actualizado Por'
    ]
  );

  migrarEquiposPrincipalesActuales_(hojaEquipos);

  hojaEquipos.setFrozenRows(1);
  hojaServidorEquipos.setFrozenRows(1);

  hojaEquipos.autoResizeColumns(
    1,
    hojaEquipos.getLastColumn()
  );

  hojaServidorEquipos.autoResizeColumns(
    1,
    hojaServidorEquipos.getLastColumn()
  );

  return {
    instalado: true,
    hojaEquipos: hojaEquipos.getName(),
    hojaServidorEquipos:
      hojaServidorEquipos.getName(),
    mensaje:
      'Administración de equipos instalada correctamente.'
  };
}

function obtenerOCrearHojaEquipos_(
  libro,
  nombre,
  encabezados
) {
  var hoja = libro.getSheetByName(nombre);

  if (!hoja) {
    hoja = libro.insertSheet(nombre);
  }

  var existentes = hoja.getLastColumn()
    ? hoja
        .getRange(1, 1, 1, hoja.getLastColumn())
        .getDisplayValues()[0]
    : [];

  encabezados.forEach(function(encabezado) {
    var existe = existentes.some(function(actual) {
      return normalizarTexto(actual) ===
        normalizarTexto(encabezado);
    });

    if (!existe) {
      var columna = hoja.getLastColumn() + 1;
      hoja.getRange(1, columna).setValue(encabezado);
      existentes.push(encabezado);
    }
  });

  hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .setFontWeight('bold');

  return hoja;
}

function migrarEquiposPrincipalesActuales_(hojaEquipos) {
  var servidores = leerHojaComoObjetos(
    HOJAS.SERVIDORES
  );

  var nombres = Array.from(
    new Set(
      servidores
        .map(function(item) {
          return String(item.equipo || '').trim();
        })
        .filter(Boolean)
    )
  );

  if (!nombres.length) {
    return;
  }

  var ultimaColumna = hojaEquipos.getLastColumn();
  var encabezados = hojaEquipos
    .getRange(1, 1, 1, ultimaColumna)
    .getDisplayValues()[0]
    .map(normalizarEncabezadoEquipo_);

  var existentes = [];

  if (hojaEquipos.getLastRow() >= 2) {
    existentes = hojaEquipos
      .getRange(
        2,
        1,
        hojaEquipos.getLastRow() - 1,
        ultimaColumna
      )
      .getDisplayValues()
      .map(function(fila) {
        return fila[
          encabezados.indexOf('nombre')
        ];
      });
  }

  nombres.forEach(function(nombre, indice) {
    var existe = existentes.some(function(actual) {
      return normalizarTexto(actual) ===
        normalizarTexto(nombre);
    });

    if (existe) {
      return;
    }

    var fila = hojaEquipos.getLastRow() + 1;
    var ahora = new Date();

    escribirValoresEquipo_(
      hojaEquipos,
      encabezados,
      fila,
      {
        id: generarIdEquipoAdministrable_(),
        nombre: nombre,
        tipo: 'Principal',
        descripcion:
          'Equipo principal migrado desde la hoja Servidores.',
        orden: indice + 1,
        activo: 'Sí',
        fechaRegistro: ahora,
        fechaActualizacion: ahora,
        actualizadoPor: 'INSTALADOR'
      }
    );
  });
}
