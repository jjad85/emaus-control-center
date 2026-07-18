/**
 * ============================================================
 * MESAS SERVICE
 * ============================================================
 *
 * Las mesas se construyen dinámicamente usando:
 * - Configuraciones
 * - Servidores
 * - Caminantes
 *
 * No se lee la hoja visual "Mesas", porque contiene
 * celdas combinadas y sirve únicamente como vista humana.
 */

/**
 * Obtiene todas las mesas del retiro.
 */
function obtenerMesas() {
  const configuracion =
    obtenerConfiguraciones();

  const numeroMesas =
    convertirNumero(
      configuracion.numeroMesas,
      10
    );

  const capacidadPorMesa =
    convertirNumero(
      configuracion.caminantesPorMesa,
      6
    );

  const servidores =
    obtenerServidores({
      equipo: 'Mesa'
    });

  const caminantes =
    obtenerCaminantes({});

  const mesas = [];

  for (
    let numeroMesa = 1;
    numeroMesa <= numeroMesas;
    numeroMesa += 1
  ) {
    mesas.push(
      construirDetalleMesa(
        numeroMesa,
        capacidadPorMesa,
        servidores,
        caminantes
      )
    );
  }

  return mesas;
}

/**
 * Obtiene una mesa por número.
 */
function obtenerMesaPorNumero(
  numeroMesa
) {
  const mesa =
    obtenerMesas().find(
      function(item) {
        return (
          Number(item.numero) ===
          Number(numeroMesa)
        );
      }
    );

  if (!mesa) {
    throw crearErrorAplicacion(
      'MESA_NO_ENCONTRADA',
      'No existe la mesa ' +
        numeroMesa +
        '.'
    );
  }

  return mesa;
}

/**
 * Construye la información consolidada
 * de una mesa.
 */
function construirDetalleMesa(
  numeroMesa,
  capacidad,
  servidores,
  caminantes
) {
  const servidoresMesa =
    servidores.filter(
      function(servidor) {
        return (
          Number(servidor.mesa) ===
          Number(numeroMesa)
        );
      }
    );

  const caminantesMesa =
    caminantes.filter(
      function(caminante) {
        return (
          Number(caminante.mesa) ===
          Number(numeroMesa)
        );
      }
    );

  const lider =
    servidoresMesa.find(
      function(servidor) {
        return (
          normalizarTexto(
            servidor.rol
          ) === 'lider'
        );
      }
    ) || null;

  const colider =
    servidoresMesa.find(
      function(servidor) {
        return (
          normalizarTexto(
            servidor.rol
          ) === 'colider'
        );
      }
    ) || null;

  const cartas =
    contarEstados(
      caminantesMesa,
      function(caminante) {
        return (
          caminante.entregables.carta
        );
      }
    );

  const fotos =
    contarEstados(
      caminantesMesa,
      function(caminante) {
        return (
          caminante.entregables.foto
        );
      }
    );

  const cartasEntregadas =
    contarEstadosCompletados(
      cartas
    );

  const fotosEntregadas =
    contarEstadosCompletados(
      fotos
    );

  return {
    numero: numeroMesa,

    lider:
      lider
        ? resumirServidor(lider)
        : null,

    colider:
      colider
        ? resumirServidor(colider)
        : null,

    capacidad: capacidad,

    cantidadCaminantes:
      caminantesMesa.length,

    cuposDisponibles:
      Math.max(
        capacidad -
          caminantesMesa.length,
        0
      ),

    porcentajeOcupacion:
      calcularPorcentaje(
        caminantesMesa.length,
        capacidad
      ),

    excedida:
      caminantesMesa.length >
      capacidad,

    cartas: {
      estados: cartas,

      porcentajeCumplimiento:
        calcularPorcentaje(
          cartasEntregadas,
          caminantesMesa.length
        )
    },

    fotos: {
      estados: fotos,

      porcentajeCumplimiento:
        calcularPorcentaje(
          fotosEntregadas,
          caminantesMesa.length
        )
    },

    caminantes:
      caminantesMesa
  };
}

/**
 * Cuenta estados considerados terminados.
 */
function contarEstadosCompletados(
  estados
) {
  return (
    Number(
      estados.entregada || 0
    ) +
    Number(
      estados.entregado || 0
    ) +
    Number(
      estados.recibida || 0
    ) +
    Number(
      estados.recibido || 0
    ) +
    Number(
      estados.completado || 0
    ) +
    Number(
      estados.aprobado || 0
    )
  );
}

/**
 * Calcula indicadores generales
 * de las mesas.
 */
function obtenerIndicadoresMesas(
  mesas
) {
  return {
    total: mesas.length,

    completas:
      mesas.filter(
        function(mesa) {
          return (
            mesa.cantidadCaminantes ===
            mesa.capacidad
          );
        }
      ).length,

    incompletas:
      mesas.filter(
        function(mesa) {
          return (
            mesa.cantidadCaminantes <
            mesa.capacidad
          );
        }
      ).length,

    excedidas:
      mesas.filter(
        function(mesa) {
          return mesa.excedida;
        }
      ).length,

    sinLider:
      mesas.filter(
        function(mesa) {
          return !mesa.lider;
        }
      ).length,

    sinColider:
      mesas.filter(
        function(mesa) {
          return !mesa.colider;
        }
      ).length,

    cuposDisponibles:
      mesas.reduce(
        function(total, mesa) {
          return (
            total +
            mesa.cuposDisponibles
          );
        },
        0
      )
  };
}

/**
 * Prueba local.
 */
function probarMesas() {
  const mesas =
    obtenerMesas();

  const resultado = {
    items: mesas,
    indicadores:
      obtenerIndicadoresMesas(
        mesas
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