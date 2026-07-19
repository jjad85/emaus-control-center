/**
 * ============================================================
 * EQUIPOS SERVICE
 * ============================================================
 *
 * Los equipos se construyen a partir
 * de la hoja Servidores.
 */

/**
 * Obtiene todos los equipos.
 */
function obtenerEquipos() {
  const servidores =
    obtenerServidores({});

  const grupos = {};

  servidores.forEach(
    function(servidor) {
      const nombreEquipo =
        servidor.equipo ||
        'Sin equipo';

      if (!grupos[nombreEquipo]) {
        grupos[nombreEquipo] = [];
      }

      grupos[nombreEquipo].push(
        servidor
      );
    }
  );

  return Object.keys(grupos)
    .sort()
    .map(function(nombreEquipo) {
      return construirEquipo(
        nombreEquipo,
        grupos[nombreEquipo]
      );
    });
}

/**
 * Consulta un equipo por nombre.
 */
function obtenerEquipoPorNombre(
  nombre
) {
  const equipo =
    obtenerEquipos().find(
      function(item) {
        return (
          normalizarTexto(
            item.nombre
          ) ===
          normalizarTexto(nombre)
        );
      }
    );

  if (!equipo) {
    throw crearErrorAplicacion(
      'EQUIPO_NO_ENCONTRADO',
      'No existe el equipo "' +
        nombre +
        '".'
    );
  }

  return equipo;
}

/**
 * Construye el detalle del equipo.
 */
function construirEquipo(
  nombre,
  integrantes
) {
  const lider =
    integrantes.find(
      function(servidor) {
        return (
          normalizarTexto(
            servidor.rolEquipo || servidor.rol
          ) === 'lider'
        );
      }
    ) || null;

  const colider =
    integrantes.find(
      function(servidor) {
        return (
          normalizarTexto(
            servidor.rol
          ) === 'colider'
        );
      }
    ) || null;

  return {
    nombre: nombre,

    lider:
      lider
        ? resumirServidor(lider)
        : null,

    colider:
      colider
        ? resumirServidor(colider)
        : null,

    cantidad:
      integrantes.length,

    integrantes:
      integrantes.map(
        resumirServidor
      ),

    pagos:
      contarEstados(
        integrantes,
        function(servidor) {
          return servidor.estadoPago;
        }
      ),

    temas:
      obtenerTemasUnicos(
        integrantes
      )
  };
}

/**
 * Devuelve temas únicos del equipo.
 */
function obtenerTemasUnicos(
  integrantes
) {
  const temas = [];

  integrantes.forEach(
    function(servidor) {
      servidor.temas.forEach(
        function(tema) {
          if (
            !temas.some(
              function(item) {
                return (
                  normalizarTexto(item) ===
                  normalizarTexto(tema)
                );
              }
            )
          ) {
            temas.push(tema);
          }
        }
      );
    }
  );

  return temas;
}

/**
 * Indicadores generales de equipos.
 */
function obtenerIndicadoresEquipos(
  equipos
) {
  return {
    total: equipos.length,

    sinLider:
      equipos.filter(
        function(equipo) {
          return !equipo.lider;
        }
      ).length,

    conColider:
      equipos.filter(
        function(equipo) {
          return Boolean(
            equipo.colider
          );
        }
      ).length,

    totalIntegrantes:
      equipos.reduce(
        function(total, equipo) {
          return (
            total +
            equipo.cantidad
          );
        },
        0
      )
  };
}

/**
 * Prueba local.
 */
function probarEquipos() {
  const equipos =
    obtenerEquipos();

  const resultado = {
    items: equipos,

    indicadores:
      obtenerIndicadoresEquipos(
        equipos
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