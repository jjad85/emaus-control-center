/**
 * Resumen ligero para los conteos del menú lateral.
 *
 * Cada conteo se entrega únicamente si la sesión posee el mismo permiso
 * utilizado para visualizar ese módulo. Cuando el usuario no tiene acceso,
 * el valor se devuelve como null y el Frontend no muestra el badge.
 */
function obtenerResumenMenu(token) {
  obtenerSesion(token);

  return {
    aspirantes:
      contarMenuConPermiso_(
        token,
        'ASPIRANTES_VER_DETALLE',
        function() {
          var respuesta = atenderAspirantes({
            token: token,
            estado: 'Pendiente'
          });

          return obtenerCantidadItemsMenu_(respuesta);
        }
      ),

    caminantes:
      contarMenuConPermiso_(
        token,
        'CAMINANTES_VER_DETALLE',
        function() {
          var respuesta = atenderCaminantes({
            token: token
          });

          var items =
            respuesta &&
            respuesta.datos &&
            Array.isArray(respuesta.datos.items)
              ? respuesta.datos.items
              : [];

          return items.filter(function(item) {
            return convertirBooleano(item.activo);
          }).length;
        }
      ),

    servidores:
      contarMenuConPermiso_(
        token,
        'SERVIDORES_VER_DETALLE',
        function() {
          var respuesta = atenderServidores({
            token: token
          });

          var items =
            respuesta &&
            respuesta.datos &&
            Array.isArray(respuesta.datos.items)
              ? respuesta.datos.items
              : [];

          return items.filter(function(item) {
            return convertirBooleano(item.activo);
          }).length;
        }
      ),

    angelitos:
      contarMenuConPermiso_(
        token,
        'SERVICIO_ANGELITOS_VER',
        function() {
          var respuesta =
            obtenerAdministracionServicioRetiro(
              token,
              'ANGELITOS'
            );

          return Array.isArray(respuesta.items)
            ? respuesta.items.length
            : 0;
        }
      ),

    serenata:
      contarMenuConPermiso_(
        token,
        'SERVICIO_SERENATA_VER',
        function() {
          var respuesta =
            obtenerAdministracionServicioRetiro(
              token,
              'SERENATA'
            );

          return Array.isArray(respuesta.items)
            ? respuesta.items.length
            : 0;
        }
      ),

    mesas:
      contarMenuConPermiso_(
        token,
        'MESAS_VER_DETALLE',
        function() {
          var respuesta = atenderMesas({
            token: token
          });

          return obtenerCantidadItemsMenu_(respuesta);
        }
      ),

    habitaciones:
      contarMenuConPermiso_(
        token,
        'HABITACIONES_VER_DETALLE',
        function() {
          var respuesta = atenderHabitaciones({
            token: token
          });

          return obtenerCantidadItemsMenu_(respuesta);
        }
      ),

    documentos:
      contarMenuConPermiso_(
        token,
        'DOCUMENTOS_CONSULTAR',
        function() {
          var respuesta =
            obtenerDocumentos(
              token,
              {}
            );

          return Array.isArray(respuesta.items)
            ? respuesta.items.length
            : 0;
        }
      )
  };
}

function contarMenuConPermiso_(
  token,
  permiso,
  obtenerCantidad
) {
  try {
    validarPermiso(
      token,
      permiso
    );

    var cantidad =
      Number(
        obtenerCantidad()
      );

    return isNaN(cantidad)
      ? 0
      : cantidad;
  } catch (error) {
    var codigo =
      String(
        error &&
        (
          error.codigo ||
          error.code ||
          error.message
        ) ||
        ''
      ).toUpperCase();

    if (
      codigo.indexOf('PERMISO') >= 0 ||
      codigo.indexOf('DENEGADO') >= 0
    ) {
      return null;
    }

    throw error;
  }
}

function obtenerCantidadItemsMenu_(
  respuesta
) {
  if (
    respuesta &&
    respuesta.datos &&
    Array.isArray(
      respuesta.datos.items
    )
  ) {
    return respuesta.datos.items.length;
  }

  if (
    respuesta &&
    Array.isArray(
      respuesta.items
    )
  ) {
    return respuesta.items.length;
  }

  return 0;
}
