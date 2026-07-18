/**
 * ============================================================
 * HABITACIONES SERVICE
 * ============================================================
 *
 * Reglas:
 * - El piso se toma de la columna "Piso" de la hoja Habitaciones.
 * - Cada habitación tiene capacidad para una sola persona.
 * - Una persona puede ser Caminante o Servidor.
 * - Para servidores se expone equipo y rol.
 * - Para caminantes se expone la mesa.
 */

function obtenerHabitaciones() {
  const habitaciones =
    leerHojaComoObjetos(
      HOJAS.HABITACIONES
    );

  const caminantes =
    obtenerCaminantes({});

  const servidores =
    obtenerServidores({});

  return habitaciones.map(
    function(registro) {
      return construirHabitacion(
        registro,
        caminantes,
        servidores
      );
    }
  );
}

function obtenerHabitacionPorId(id) {
  const habitacion =
    obtenerHabitaciones()
      .find(function(item) {
        return (
          String(item.id) === String(id) ||
          String(item.habitacion) === String(id)
        );
      });

  if (!habitacion) {
    throw crearErrorAplicacion(
      'HABITACION_NO_ENCONTRADA',
      'No existe la habitación ' + id + '.'
    );
  }

  return habitacion;
}

function construirHabitacion(
  registro,
  caminantes,
  servidores
) {
  const numeroHabitacion =
    registro.habitacion ||
    registro.nombre ||
    registro.id;

  const personasEncontradas = [];

  caminantes
    .filter(function(item) {
      return (
        String(item.habitacion).trim() ===
        String(numeroHabitacion).trim()
      );
    })
    .forEach(function(item) {
      personasEncontradas.push({
        id: item.id,
        nombre: item.nombre,
        tipoPersona: 'Caminante',
        mesa: item.mesa || '',
        equipo: '',
        rol: '',
        asignado: true
      });
    });

  servidores
  .filter(function(item) {
    return (
      String(item.habitacion).trim() ===
      String(numeroHabitacion).trim()
    );
  })
  .forEach(function(item) {
    personasEncontradas.push({
      id: item.id,
      nombre: item.nombre,
      tipoPersona: 'Servidor',

      equipo: item.equipo || '',
      rol: item.rol || '',

      mesa: '',
      asignado: true
    });
  });

  const personaAsignada =
    personasEncontradas.length > 0
      ? personasEncontradas[0]
      : null;

  return {
    id:
      registro.id ||
      numeroHabitacion,

    habitacion:
      numeroHabitacion,

    piso:
      registro.piso || '',

    tipo:
      registro.tipo || '',

    capacidad: 1,

    ocupantes:
      personaAsignada ? 1 : 0,

    cuposDisponibles:
      personaAsignada ? 0 : 1,

    porcentajeOcupacion:
      personaAsignada ? 100 : 0,

    asignada:
      Boolean(personaAsignada),

    persona:
      personaAsignada,

    personas:
      personaAsignada
        ? [personaAsignada]
        : [],

    conflictoAsignacion:
      personasEncontradas.length > 1,

    cantidadAsignados:
      personasEncontradas.length,

    observaciones:
      registro.observaciones || '',
      versionServicio: 'HABITACIONES_V4_CON_EQUIPO',
  };
}

function obtenerIndicadoresHabitaciones(
  habitaciones
) {
  return {
    total:
      habitaciones.length,

    ocupadas:
      habitaciones.filter(
        function(item) {
          return item.asignada;
        }
      ).length,

    disponibles:
      habitaciones.filter(
        function(item) {
          return !item.asignada;
        }
      ).length,

    conConflicto:
      habitaciones.filter(
        function(item) {
          return item.conflictoAsignacion;
        }
      ).length
  };
}

function probarHabitaciones() {
  const habitaciones =
    obtenerHabitaciones();

  console.log(
    JSON.stringify(
      {
        items: habitaciones,
        indicadores:
          obtenerIndicadoresHabitaciones(
            habitaciones
          )
      },
      null,
      2
    )
  );
}
