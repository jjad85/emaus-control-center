/**
 * Instala la recuperación de contraseña por correo.
 *
 * Ejecutar una sola vez desde Apps Script:
 * instalarRecuperacionClave()
 */
function instalarRecuperacionClave() {
  const libro =
    obtenerLibro();

  asegurarColumnasRecuperacion(
    libro,
    HOJAS.USUARIOS,
    [
      'Correo',
      'Celular',
      'Version Sesion'
    ]
  );

  asegurarColumnasRecuperacion(
    libro,
    HOJAS.SERVIDORES,
    [
      'Correo',
      'Celular'
    ]
  );

  let hoja =
    libro.getSheetByName(
      HOJAS.RECUPERACIONES_CLAVE
    );

  if (!hoja) {
    hoja =
      libro.insertSheet(
        HOJAS.RECUPERACIONES_CLAVE
      );
  }

  if (
    hoja.getLastRow() === 0
  ) {
    hoja.appendRow([
      'ID',
      'Usuario ID',
      'Usuario',
      'Correo',
      'Salt',
      'Codigo Hash',
      'Fecha Solicitud',
      'Fecha Vencimiento',
      'Estado',
      'Intentos',
      'Fecha Cierre',
      'Observacion'
    ]);

    hoja.setFrozenRows(1);
  }

  inicializarVersionSesionUsuarios(
    libro
  );

  return {
    instalado: true,
    hoja:
      HOJAS.RECUPERACIONES_CLAVE,
    mensaje:
      'Recuperación de contraseña instalada correctamente.'
  };
}

function asegurarColumnasRecuperacion(
  libro,
  nombreHoja,
  columnas
) {
  const hoja =
    libro.getSheetByName(
      nombreHoja
    );

  if (!hoja) {
    throw crearErrorAplicacion(
      'HOJA_NO_EXISTE',
      'No existe la hoja "' +
        nombreHoja +
        '".'
    );
  }

  let encabezados =
    hoja.getLastColumn() > 0
      ? hoja.getRange(
          1,
          1,
          1,
          hoja.getLastColumn()
        ).getDisplayValues()[0]
      : [];

  const normalizados =
    encabezados.map(
      normalizarTexto
    );

  columnas.forEach(
    function(columna) {
      if (
        normalizados.indexOf(
          normalizarTexto(columna)
        ) === -1
      ) {
        hoja.getRange(
          1,
          hoja.getLastColumn() + 1
        ).setValue(
          columna
        );

        normalizados.push(
          normalizarTexto(columna)
        );
      }
    }
  );

  hoja.setFrozenRows(1);
}

function inicializarVersionSesionUsuarios(
  libro
) {
  const hoja =
    libro.getSheetByName(
      HOJAS.USUARIOS
    );

  const encabezados =
    hoja.getRange(
      1,
      1,
      1,
      hoja.getLastColumn()
    ).getDisplayValues()[0]
      .map(normalizarTexto);

  const columna =
    Math.max(
      encabezados.indexOf(
        'version sesion'
      ),
      encabezados.indexOf(
        'versionsesion'
      )
    ) + 1;

  if (
    columna <= 0 ||
    hoja.getLastRow() < 2
  ) {
    return;
  }

  const rango =
    hoja.getRange(
      2,
      columna,
      hoja.getLastRow() - 1,
      1
    );

  const valores =
    rango.getValues()
      .map(function(fila) {
        return [
          Number(fila[0]) || 1
        ];
      });

  rango.setValues(
    valores
  );
}
