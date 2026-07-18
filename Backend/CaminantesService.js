/**
 * ============================================================
 * CAMINANTES SERVICE
 * ============================================================
 */

/**
 * Obtiene todos los caminantes aplicando filtros opcionales.
 */
function obtenerCaminantes(filtros) {
  const parametros = filtros || {};

  return leerHojaComoObjetos(
    HOJAS.CAMINANTES
  )
    .map(convertirCaminante)
    .filter(function(caminante) {
      return (
        coincideTexto(
          caminante.nombre,
          parametros.nombre
        ) &&
        coincideExacto(
          caminante.estadoPago,
          parametros.estadoPago
        ) &&
        coincideExacto(
          caminante.mesa,
          parametros.mesa
        ) &&
        coincideExacto(
          caminante.habitacion,
          parametros.habitacion
        ) &&
        coincideExacto(
          caminante.entregables.carta,
          parametros.carta
        ) &&
        coincideExacto(
          caminante.entregables.foto,
          parametros.foto
        )
      );
    });
}

/**
 * Consulta un caminante por ID.
 */
function obtenerCaminantePorId(id) {
  const caminante = obtenerCaminantes({})
    .find(function(item) {
      return String(item.id) === String(id);
    });

  if (!caminante) {
    throw crearErrorAplicacion(
      'CAMINANTE_NO_ENCONTRADO',
      'No existe el caminante con ID ' + id + '.'
    );
  }

  return {
    id: caminante.id,

    datosBasicos: {
      nombre: caminante.nombre,
      telefono: caminante.telefono,
      estadoPago: caminante.estadoPago
    },

    datosLogisticos: {
      mesa: caminante.mesa,
      habitacion: caminante.habitacion
    },

    contacto: caminante.contacto,

    entregables: caminante.entregables
  };
}

/**
 * Convierte una fila de Sheets en un caminante.
 */
function convertirCaminante(registro) {
  return {
    id: registro.id || '',

    nombre: registro.nombre || '',

    telefono: registro.telefono || '',

    estadoPago:
      registro.estadoPago ||
      'Sin definir',

    mesa: registro.mesa || '',

    habitacion:
      registro.habitacion || '',

    contacto: {
      nombre:
        registro.contacto || '',

      telefono:
        registro.telefonoContacto || ''
    },

    entregables: {
      carta:
        registro.carta ||
        'Sin definir',

      foto:
        registro.foto ||
        'Sin definir'
    }
  };
}

/**
 * Calcula indicadores generales de caminantes.
 */
function obtenerIndicadoresCaminantes(
  caminantes
) {
  const configuracion =
    obtenerConfiguraciones();

  const meta = convertirNumero(
    configuracion.metaCaminantes,
    0
  );

  const total = caminantes.length;

  return {
    total: total,

    meta: meta,

    cuposDisponibles:
      Math.max(meta - total, 0),

    porcentajeMeta:
      calcularPorcentaje(
        total,
        meta
      ),

    pagos:
      contarEstados(
        caminantes,
        function(item) {
          return item.estadoPago;
        }
      ),

    cartas:
      contarEstados(
        caminantes,
        function(item) {
          return item.entregables.carta;
        }
      ),

    fotos:
      contarEstados(
        caminantes,
        function(item) {
          return item.entregables.foto;
        }
      ),

    sinMesa:
      caminantes.filter(function(item) {
        return !String(item.mesa).trim();
      }).length,

    sinHabitacion:
      caminantes.filter(function(item) {
        return !String(
          item.habitacion
        ).trim();
      }).length
  };
}

/**
 * Prueba local.
 */
function probarCaminantes() {
  const caminantes =
    obtenerCaminantes({});

  const resultado = {
    items: caminantes,
    indicadores:
      obtenerIndicadoresCaminantes(
        caminantes
      )
  };

  console.log(
    JSON.stringify(
      resultado,
      null,
      2
    )
  );
}