/**
 * ============================================================
 * LIMPIEZA DE NOTIFICACIONES WHATSAPP DUPLICADAS
 * ============================================================
 *
 * Ejecutar una sola vez:
 *
 * limpiarNotificacionesWhatsappDuplicadas();
 *
 * Esta versión NO depende de HOJAS.NOTIFICACIONES.
 * Localiza automáticamente la hoja por sus encabezados.
 */
function limpiarNotificacionesWhatsappDuplicadas() {
  const hoja =
    obtenerHojaNotificacionesWhatsapp_();

  const datos =
    hoja
      .getDataRange()
      .getValues();

  if (datos.length <= 1) {
    return {
      hoja:
        hoja.getName(),
      duplicadosDesactivados: 0
    };
  }

  const encabezados =
    datos[0].map(
      function(valor) {
        return normalizarTexto(
          valor
        );
      }
    );

  const indiceTipo =
    encabezados.indexOf('tipo');

  const indiceEntidad =
    encabezados.indexOf('entidad');

  const indiceEntidadId =
    encabezados.indexOf('entidadid');

  const indiceEstado =
    encabezados.indexOf('estado');

  const indiceActivo =
    encabezados.indexOf('activo');

  const indiceFecha =
    encabezados.indexOf(
      'fechacreacion'
    );

  if (
    indiceTipo < 0 ||
    indiceEntidad < 0 ||
    indiceEntidadId < 0 ||
    indiceActivo < 0
  ) {
    throw crearErrorAplicacion(
      'COLUMNAS_NOTIFICACIONES_INCOMPLETAS',
      'La hoja "' +
        hoja.getName() +
        '" no contiene las columnas necesarias.'
    );
  }

  const grupos = {};

  for (
    let fila = 1;
    fila < datos.length;
    fila += 1
  ) {
    const registro =
      datos[fila];

    const activo =
      convertirBooleano(
        registro[indiceActivo]
      );

    const pendiente =
      indiceEstado < 0 ||
      normalizarTexto(
        registro[indiceEstado]
      ) === 'pendiente';

    if (
      !activo ||
      !pendiente
    ) {
      continue;
    }

    const clave = [
      normalizarTexto(
        registro[indiceTipo]
      ),
      normalizarTexto(
        registro[indiceEntidad]
      ),
      String(
        registro[indiceEntidadId] ||
        ''
      ).trim()
    ].join('|');

    if (!grupos[clave]) {
      grupos[clave] = [];
    }

    grupos[clave].push({
      fila:
        fila + 1,

      fecha:
        indiceFecha >= 0
          ? registro[indiceFecha]
          : '',

      orden:
        fila
    });
  }

  let desactivados = 0;

  Object.keys(
    grupos
  ).forEach(
    function(clave) {
      const registros =
        grupos[clave];

      if (
        registros.length <= 1
      ) {
        return;
      }

      registros.sort(
        function(a, b) {
          const tiempoA =
            obtenerTiempoNotificacion_(
              a.fecha
            );

          const tiempoB =
            obtenerTiempoNotificacion_(
              b.fecha
            );

          if (tiempoA !== tiempoB) {
            return tiempoA - tiempoB;
          }

          return (
            a.orden -
            b.orden
          );
        }
      );

      registros
        .slice(1)
        .forEach(
          function(registro) {
            hoja
              .getRange(
                registro.fila,
                indiceActivo + 1
              )
              .setValue('No');

            desactivados += 1;
          }
        );
    }
  );

  SpreadsheetApp.flush();

  const resultado = {
    hoja:
      hoja.getName(),

    duplicadosDesactivados:
      desactivados
  };

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );

  return resultado;
}


/**
 * Busca la hoja correcta según su estructura.
 *
 * Encabezados obligatorios:
 * - tipo
 * - entidad
 * - entidadId
 * - estado
 * - fechaCreacion
 * - activo
 */
function obtenerHojaNotificacionesWhatsapp_() {
  const libro =
    obtenerLibro();

  const hojas =
    libro.getSheets();

  const obligatorios = [
    'tipo',
    'entidad',
    'entidadid',
    'estado',
    'fechacreacion',
    'activo'
  ];

  const encontrada =
    hojas.find(
      function(hoja) {
        const ultimaColumna =
          hoja.getLastColumn();

        if (
          ultimaColumna <
          obligatorios.length
        ) {
          return false;
        }

        const encabezados =
          hoja
            .getRange(
              1,
              1,
              1,
              ultimaColumna
            )
            .getDisplayValues()[0]
            .map(
              function(valor) {
                return normalizarTexto(
                  valor
                );
              }
            );

        return obligatorios.every(
          function(campo) {
            return (
              encabezados.indexOf(
                campo
              ) !== -1
            );
          }
        );
      }
    );

  if (!encontrada) {
    throw crearErrorAplicacion(
      'HOJA_NOTIFICACIONES_NO_ENCONTRADA',
      'No se encontró una hoja con la estructura de notificaciones de WhatsApp.'
    );
  }

  return encontrada;
}


function obtenerTiempoNotificacion_(
  valor
) {
  if (
    valor instanceof Date
  ) {
    return valor.getTime();
  }

  const texto =
    String(
      valor || ''
    ).trim();

  if (!texto) {
    return 0;
  }

  const directa =
    new Date(texto);

  if (
    !isNaN(
      directa.getTime()
    )
  ) {
    return directa.getTime();
  }

  const coincidencia =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );

  if (!coincidencia) {
    return 0;
  }

  return new Date(
    Number(coincidencia[3]),
    Number(coincidencia[2]) - 1,
    Number(coincidencia[1]),
    Number(coincidencia[4] || 0),
    Number(coincidencia[5] || 0),
    Number(coincidencia[6] || 0)
  ).getTime();
}
