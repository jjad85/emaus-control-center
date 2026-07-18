/**
 * ============================================================
 * DASHBOARD SERVICE
 * ============================================================
 */

function obtenerDashboard() {
  const configuracion =
    obtenerConfiguraciones();

  const caminantes =
    obtenerCaminantes({});

  const servidores =
    obtenerServidores({});

  const mesas =
    obtenerMesas();

  const equipos =
    obtenerEquipos();

  const presentaciones =
    obtenerPresentaciones({});

  const habitaciones =
    obtenerHabitaciones();

  const indicadoresCaminantes =
    obtenerIndicadoresCaminantes(
      caminantes
    );

  const indicadoresServidores =
    obtenerIndicadoresServidores(
      servidores
    );

  const indicadoresMesas =
    obtenerIndicadoresMesas(
      mesas
    );

  const indicadoresEquipos =
    obtenerIndicadoresEquipos(
      equipos
    );

  const indicadoresPresentaciones =
    obtenerIndicadoresPresentaciones(
      presentaciones
    );

  const indicadoresHabitaciones =
    obtenerIndicadoresHabitaciones(
      habitaciones
    );

  return {
    configuracion: configuracion,

    titulo:
      configuracion.titulo,

    subtitulo:
      configuracion.subtitulo,

    caminantes:
      indicadoresCaminantes,

    servidores:
      indicadoresServidores,

    mesas:
      indicadoresMesas,

    equipos:
      indicadoresEquipos,

    presentaciones:
      indicadoresPresentaciones,

    habitaciones:
      indicadoresHabitaciones,

    alertas:
      construirAlertasDashboard({
        configuracion: configuracion,
        caminantes: caminantes,
        servidores: servidores,
        mesas: mesas,
        presentaciones: presentaciones,
        habitaciones: habitaciones,
        indicadoresCaminantes:
          indicadoresCaminantes,
        indicadoresServidores:
          indicadoresServidores
      })
  };
}

function construirAlertasDashboard(
  contexto
) {
  const alertas = [];

  if (
    contexto.indicadoresCaminantes
      .cuposDisponibles > 0
  ) {
    alertas.push({
      tipo: 'info',
      modulo: 'Caminantes',
      mensaje:
        'Faltan ' +
        contexto.indicadoresCaminantes
          .cuposDisponibles +
        ' caminantes para cumplir la meta.'
    });
  }

  if (
    contexto.indicadoresCaminantes
      .sinMesa > 0
  ) {
    alertas.push({
      tipo: 'warning',
      modulo: 'Caminantes',
      mensaje:
        contexto.indicadoresCaminantes
          .sinMesa +
        ' caminantes no tienen mesa.'
    });
  }

  if (
    contexto.indicadoresCaminantes
      .sinHabitacion > 0
  ) {
    alertas.push({
      tipo: 'warning',
      modulo: 'Habitaciones',
      mensaje:
        contexto.indicadoresCaminantes
          .sinHabitacion +
        ' caminantes no tienen habitación.'
    });
  }

  if (
    contexto.indicadoresServidores
      .sinHabitacion > 0
  ) {
    alertas.push({
      tipo: 'warning',
      modulo: 'Servidores',
      mensaje:
        contexto.indicadoresServidores
          .sinHabitacion +
        ' servidores no tienen habitación.'
    });
  }

  const servidoresPagoPendiente =
    contexto.servidores.filter(
      function(item) {
        return (
          normalizarTexto(
            item.estadoPago
          ) === 'pendiente'
        );
      }
    ).length;

  if (servidoresPagoPendiente > 0) {
    alertas.push({
      tipo: 'warning',
      modulo: 'Servidores',
      mensaje:
        servidoresPagoPendiente +
        ' servidores tienen pago pendiente.'
    });
  }

  const presentacionesPendientes =
    contexto.presentaciones.filter(
      function(item) {
        return !presentacionCompletada(
          item.entrega
        );
      }
    ).length;

  if (presentacionesPendientes > 0) {
    alertas.push({
      tipo: 'warning',
      modulo: 'Presentaciones',
      mensaje:
        presentacionesPendientes +
        ' presentaciones no han sido entregadas.'
    });
  }

  contexto.mesas.forEach(
    function(mesa) {
      if (!mesa.lider) {
        alertas.push({
          tipo: 'error',
          modulo: 'Mesas',
          mensaje:
            'La mesa ' +
            mesa.numero +
            ' no tiene líder.'
        });
      }

      if (!mesa.colider) {
        alertas.push({
          tipo: 'error',
          modulo: 'Mesas',
          mensaje:
            'La mesa ' +
            mesa.numero +
            ' no tiene colíder.'
        });
      }

      if (mesa.excedida) {
        alertas.push({
          tipo: 'error',
          modulo: 'Mesas',
          mensaje:
            'La mesa ' +
            mesa.numero +
            ' supera su capacidad.'
        });
      }
    }
  );

  contexto.habitaciones.forEach(
    function(habitacion) {
      if (
        habitacion.capacidad > 0 &&
        habitacion.ocupantes >
          habitacion.capacidad
      ) {
        alertas.push({
          tipo: 'error',
          modulo: 'Habitaciones',
          mensaje:
            'La habitación ' +
            habitacion.habitacion +
            ' supera su capacidad.'
        });
      }
    }
  );

  return alertas;
}

function probarDashboard() {
  console.log(
    JSON.stringify(
      obtenerDashboard(),
      null,
      2
    )
  );
}