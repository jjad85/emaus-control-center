/**
 * ============================================================
 * PRESENTACIONES SERVICE
 * ============================================================
 */

function obtenerPresentaciones(filtros) {
  const parametros = filtros || {};

  return leerHojaComoObjetos(
    HOJAS.PRESENTACIONES
  )
    .map(convertirPresentacion)
    .filter(function(presentacion) {
      return (
        coincideTexto(
          presentacion.nombre,
          parametros.nombre
        ) &&
        coincideTexto(
          presentacion.tema,
          parametros.tema
        ) &&
        coincideExacto(
          presentacion.entrega,
          parametros.entrega
        ) &&
        coincideExacto(
          presentacion.apoyoAudiovisual,
          parametros.apoyoAudiovisual
        ) &&
        coincideExacto(
          presentacion.ajustadoAudiovisuales,
          parametros.ajustado
        ) &&
        coincideExacto(
          presentacion.aprobadoConferencista,
          parametros.aprobado
        )
      );
    });
}

function obtenerPresentacionPorId(id) {
  const presentacion =
    obtenerPresentaciones({})
      .find(function(item) {
        return String(item.id) === String(id);
      });

  if (!presentacion) {
    throw crearErrorAplicacion(
      'PRESENTACION_NO_ENCONTRADA',
      'No existe la presentación con ID ' + id + '.'
    );
  }

  return presentacion;
}

function convertirPresentacion(registro) {
  return {
    id: registro.id || '',
    nombre: registro.nombre || '',
    tema: registro.tema || '',
    entrega:
      registro.entrega || 'Sin definir',
    apoyoAudiovisual:
      registro.apoyoAudiovisual || 'Por definir',
    ajustadoAudiovisuales:
      registro.ajustadoAudiovisuales || 'Sin definir',
    aprobadoConferencista:
      registro.aprobadoConferencista || 'Sin definir',
    observaciones:
      registro.observaciones || ''
  };
}

function presentacionCompletada(valor) {
  const estado = normalizarTexto(valor);

  return [
    'completado',
    'entregado',
    'entregada',
    'aprobado'
  ].includes(estado);
}

function apoyoDefinido(valor) {
  const estado = normalizarTexto(valor);

  return (
    estado !== '' &&
    estado !== 'por definir' &&
    estado !== 'sin definir'
  );
}

function obtenerIndicadoresPresentaciones(
  presentaciones
) {
  const entregadas =
    presentaciones.filter(function(item) {
      return presentacionCompletada(
        item.entrega
      );
    }).length;

  const apoyosDefinidos =
    presentaciones.filter(function(item) {
      return apoyoDefinido(
        item.apoyoAudiovisual
      );
    }).length;

  const ajustadas =
    presentaciones.filter(function(item) {
      return presentacionCompletada(
        item.ajustadoAudiovisuales
      );
    }).length;

  const aprobadas =
    presentaciones.filter(function(item) {
      return presentacionCompletada(
        item.aprobadoConferencista
      );
    }).length;

  const totalEtapas =
    presentaciones.length * 4;

  return {
    totalConferencistas:
      new Set(
        presentaciones
          .map(function(item) {
            return item.nombre;
          })
          .filter(Boolean)
      ).size,

    totalPresentaciones:
      presentaciones.length,

    entregadas: entregadas,

    apoyosDefinidos:
      apoyosDefinidos,

    ajustadas: ajustadas,

    aprobadas: aprobadas,

    estadosEntrega:
      contarEstados(
        presentaciones,
        function(item) {
          return item.entrega;
        }
      ),

    avanceGeneral:
      calcularPorcentaje(
        entregadas +
          apoyosDefinidos +
          ajustadas +
          aprobadas,
        totalEtapas
      )
  };
}

function probarPresentaciones() {
  const presentaciones =
    obtenerPresentaciones({});

  console.log(
    JSON.stringify(
      {
        items: presentaciones,
        indicadores:
          obtenerIndicadoresPresentaciones(
            presentaciones
          )
      },
      null,
      2
    )
  );
}