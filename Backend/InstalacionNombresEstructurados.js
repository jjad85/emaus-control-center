/**
 * Entrega 6.16.1
 * Estandariza los campos de nombre en camelCase:
 *
 * - primerNombre
 * - segundoNombre
 * - primerApellido
 * - segundoApellido
 *
 * Si la entrega anterior creó encabezados con espacios
 * ("Primer Nombre", etc.), los renombra EN LA MISMA COLUMNA,
 * conservando los datos existentes.
 *
 * No intenta dividir automáticamente nombres históricos.
 */
function instalarNombresEstructuradosPersonas() {
  const libro = obtenerLibro();

  const campos = [
    {
      tecnico: 'primerNombre',
      variantes: ['Primer Nombre', 'primer nombre']
    },
    {
      tecnico: 'segundoNombre',
      variantes: ['Segundo Nombre', 'segundo nombre']
    },
    {
      tecnico: 'primerApellido',
      variantes: ['Primer Apellido', 'primer apellido']
    },
    {
      tecnico: 'segundoApellido',
      variantes: ['Segundo Apellido', 'segundo apellido']
    }
  ];

  [
    HOJAS.ASPIRANTES,
    HOJAS.CAMINANTES,
    HOJAS.SERVIDORES
  ].forEach(function(nombreHoja) {
    const hoja = libro.getSheetByName(nombreHoja);

    if (!hoja) {
      throw new Error(
        'No existe la hoja requerida: ' + nombreHoja
      );
    }

    campos.forEach(function(campo) {
      asegurarEncabezadoCamelCase_(
        hoja,
        campo.tecnico,
        campo.variantes
      );
    });
  });

  return {
    instalado: true,
    hojas: [
      HOJAS.ASPIRANTES,
      HOJAS.CAMINANTES,
      HOJAS.SERVIDORES
    ],
    columnas: campos.map(function(campo) {
      return campo.tecnico;
    })
  };
}

function asegurarEncabezadoCamelCase_(
  hoja,
  encabezadoTecnico,
  variantes
) {
  const ultimaColumna = Math.max(
    hoja.getLastColumn(),
    1
  );

  const encabezados = hoja
    .getRange(
      1,
      1,
      1,
      ultimaColumna
    )
    .getDisplayValues()[0];

  const indiceTecnico = encabezados.findIndex(
    function(valor) {
      return String(valor || '').trim() === encabezadoTecnico;
    }
  );

  if (indiceTecnico >= 0) {
    return;
  }

  const variantesNormalizadas = (variantes || []).map(
    function(valor) {
      return normalizarTexto(valor);
    }
  );

  const indiceAnterior = encabezados.findIndex(
    function(valor) {
      return variantesNormalizadas.indexOf(
        normalizarTexto(valor)
      ) >= 0;
    }
  );

  if (indiceAnterior >= 0) {
    hoja
      .getRange(
        1,
        indiceAnterior + 1
      )
      .setValue(encabezadoTecnico);

    return;
  }

  hoja
    .getRange(
      1,
      hoja.getLastColumn() + 1
    )
    .setValue(encabezadoTecnico);
}
