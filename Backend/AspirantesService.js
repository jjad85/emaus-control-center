/**
 * ============================================================
 * ASPIRANTES SERVICE
 * ============================================================
 */

const ESTADOS_ASPIRANTE = [
  'Pendiente',
  'En revisión',
  'Aprobado',
  'Rechazado',
  'Convertido'
];

function obtenerPortalPublico() {
  const configuracion =
    obtenerConfiguraciones();

  return {
    titulo:
      configuracion.portalTitulo ||
      'Retiro de Emaús',

    subtitulo:
      configuracion.portalSubtitulo ||
      '',

    contenidoHtml:
      configuracion.portalContenidoHtml ||
      '',

    registroActivo:
      convertirBooleano(
        configuracion.portalRegistroActivo
      ),

    mensajeRegistroCerrado:
      configuracion.portalMensajeRegistroCerrado ||
      '',

    textoBotonRegistro:
      configuracion.portalTextoBotonRegistro ||
      'Registrarme al retiro',

    textoBotonLogin:
      configuracion.portalTextoBotonLogin ||
      'Ingresar al centro de control',

    mensajeConfirmacion:
      configuracion.portalMensajeConfirmacion ||
      ''
  };
}

function convertirFechaAspiranteMilisegundos(
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

  const fechaDirecta =
    new Date(texto);

  if (
    !isNaN(
      fechaDirecta.getTime()
    )
  ) {
    return fechaDirecta.getTime();
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

function obtenerAspirantes(
  token,
  filtros
) {
  validarPermiso(
    token,
    'CONSULTAR_ASPIRANTES'
  );

  const parametros =
    filtros || {};

  return leerHojaComoObjetos(
    HOJAS.ASPIRANTES
  )
    .filter(function(item) {
      return convertirBooleano(
        item.activo
      );
    })
    .filter(function(item) {
      return (
        !parametros.estado ||
        normalizarTexto(
          item.estadoSolicitud
        ) ===
          normalizarTexto(
            parametros.estado
          )
      );
    })
    .sort(function(a, b) {
      const fechaA =
        convertirFechaAspiranteMilisegundos(
          a.fechaRegistro
        );

      const fechaB =
        convertirFechaAspiranteMilisegundos(
          b.fechaRegistro
        );

      if (fechaA !== fechaB) {
        return fechaA - fechaB;
      }

      return (
        convertirNumero(
          a.id,
          0
        ) -
        convertirNumero(
          b.id,
          0
        )
      );
    });
}


function obtenerIndicadoresAspirantes(
  items
) {
  const aspirantes =
    Array.isArray(items)
      ? items
      : [];

  const contarEstado =
    function(estado) {
      return aspirantes.filter(
        function(item) {
          return (
            normalizarTexto(
              item.estadoSolicitud
            ) ===
            normalizarTexto(
              estado
            )
          );
        }
      ).length;
    };

  return {
    total:
      aspirantes.length,
    pendientes:
      contarEstado('Pendiente'),
    enRevision:
      contarEstado('En revisión'),
    aprobados:
      contarEstado('Aprobado'),
    rechazados:
      contarEstado('Rechazado'),
    convertidos:
      contarEstado('Convertido')
  };
}

function obtenerAspirantePorId(
  id
) {
  const registro =
    leerHojaComoObjetos(
      HOJAS.ASPIRANTES
    )
      .find(function(item) {
        return (
          String(item.id) ===
          String(id)
        );
      });

  if (!registro) {
    throw crearErrorAplicacion(
      'ASPIRANTE_NO_ENCONTRADO',
      'No existe el aspirante indicado.'
    );
  }

  return registro;
}
