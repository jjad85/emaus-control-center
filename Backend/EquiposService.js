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
  const servidores = obtenerServidores({});
  const grupos = {};

  servidores.forEach(function(servidor) {
    const nombreEquipo = servidor.equipo || 'Sin equipo';

    if (!grupos[nombreEquipo]) {
      grupos[nombreEquipo] = [];
    }

    grupos[nombreEquipo].push(servidor);
  });

  const principales = Object.keys(grupos)
    .sort(function(a, b) {
      return String(a).localeCompare(String(b), 'es');
    })
    .map(function(nombreEquipo) {
      return Object.assign(
        construirEquipo(nombreEquipo, grupos[nombreEquipo]),
        {
          id: '',
          tipo: 'Principal',
          activo: true,
          descripcion: ''
        }
      );
    });

  if (typeof leerHojaAdministracionEquipos_ !== 'function') {
    return principales;
  }

  const administrables = leerHojaAdministracionEquipos_();
  const asignaciones = typeof leerAsignacionesEquiposApoyo_ === 'function'
    ? leerAsignacionesEquiposApoyo_()
    : [];
  const servidorPorId = {};

  servidores.forEach(function(servidor) {
    servidorPorId[String(servidor.id)] = servidor;
  });

  const apoyos = administrables
    .filter(function(equipo) {
      return normalizarTexto(equipo.tipo) === 'apoyo';
    })
    .map(function(equipo) {
      const integrantes = asignaciones
        .filter(function(asignacion) {
          return (
            asignacion.activo &&
            String(asignacion.equipoId) === String(equipo.id)
          );
        })
        .map(function(asignacion) {
          return servidorPorId[String(asignacion.servidorId)];
        })
        .filter(Boolean);

      return Object.assign(
        construirEquipo(equipo.nombre, integrantes),
        {
          id: equipo.id,
          tipo: 'Apoyo',
          activo: equipo.activo,
          descripcion: equipo.descripcion || '',
          orden: equipo.orden || 0
        }
      );
    })
    .sort(function(a, b) {
      const ordenA = Number(a.orden) || 9999;
      const ordenB = Number(b.orden) || 9999;

      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }

      return String(a.nombre).localeCompare(String(b.nombre), 'es');
    });

  return principales.concat(apoyos);
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