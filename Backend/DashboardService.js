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

  /*
   * Reutiliza las colecciones ya cargadas.
   * Antes Mesas, Equipos y Habitaciones volvían a leer Caminantes
   * y Servidores varias veces durante una sola carga del Dashboard.
   */
  const mesas =
    obtenerMesas(
      caminantes,
      servidores
    );

  const equipos =
    obtenerEquipos(
      servidores
    );

  const presentaciones =
    obtenerPresentaciones({});

  const habitaciones =
    obtenerHabitaciones(
      caminantes,
      servidores
    );

  const indicadoresCaminantes =
    obtenerIndicadoresCaminantes(
      caminantes
    );

  const indicadoresServidores =
    obtenerIndicadoresServidores(
      servidores
    );

  indicadoresServidores.sinEquipo = servidores.filter(function(item) {
    return !String(item.equipo || '').trim();
  }).length;

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

  const fechasImportantes =
    obtenerFechasImportantesDashboard();

  const resumenMesas =
    construirResumenMesasDashboard_(mesas);

  const resumenFinanciero =
    construirResumenFinancieroDashboard_();

  const contextoDashboard = {
    configuracion: configuracion,
    caminantes: caminantes,
    servidores: servidores,
    mesas: mesas,
    equipos: equipos,
    presentaciones: presentaciones,
    habitaciones: habitaciones,
    fechasImportantes: fechasImportantes,
    resumenMesas: resumenMesas,
    resumenFinanciero: resumenFinanciero,
    indicadoresCaminantes: indicadoresCaminantes,
    indicadoresServidores: indicadoresServidores,
    indicadoresMesas: indicadoresMesas,
    indicadoresEquipos: indicadoresEquipos,
    indicadoresPresentaciones: indicadoresPresentaciones,
    indicadoresHabitaciones: indicadoresHabitaciones
  };

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

    fechasImportantes:
      fechasImportantes,

    resumenMesas:
      resumenMesas,

    resumenFinanciero:
      resumenFinanciero,

    pulso:
      construirPulsoDashboard_(contextoDashboard),

    alertas:
      construirAlertasDashboard(contextoDashboard)
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

  if (contexto.indicadoresServidores.sinEquipo > 0) {
    alertas.push({
      tipo: 'warning',
      modulo: 'Servidores',
      mensaje: contexto.indicadoresServidores.sinEquipo +
        ' servidores no tienen equipo asignado.'
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
          !item.exentoPago &&
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
      if (mesa.excedida) {
        alertas.push({
          tipo: 'error',
          modulo: 'Mesas',
          mensaje:
            'La mesa ' +
            mesa.numero +
            ' tiene ' +
            mesa.cantidadCaminantes +
            ' caminantes y su capacidad es ' +
            mesa.capacidad +
            '.'
        });
      } else if (mesa.cantidadCaminantes < mesa.capacidad) {
        alertas.push({
          tipo: 'warning',
          modulo: 'Mesas',
          mensaje:
            'A la mesa ' +
            mesa.numero +
            ' le faltan ' +
            (mesa.capacidad - mesa.cantidadCaminantes) +
            ' caminantes para completar su capacidad.'
        });
      }

      var cartasRecibidas = contarEstadosCompletados(mesa.cartas.estados || {});
      var fotosRecibidas = contarEstadosCompletados(mesa.fotos.estados || {});

      if (cartasRecibidas < mesa.cantidadCaminantes) {
        alertas.push({
          tipo: 'warning',
          modulo: 'Cartas',
          mensaje:
            'La mesa ' +
            mesa.numero +
            ' tiene ' +
            cartasRecibidas +
            ' de ' +
            mesa.cantidadCaminantes +
            ' cartas recolectadas.'
        });
      }

      if (fotosRecibidas < mesa.cantidadCaminantes) {
        alertas.push({
          tipo: 'warning',
          modulo: 'Fotos',
          mensaje:
            'La mesa ' +
            mesa.numero +
            ' tiene ' +
            fotosRecibidas +
            ' de ' +
            mesa.cantidadCaminantes +
            ' fotos recolectadas.'
        });
      }
    }
  );

  if (contexto.resumenFinanciero.valorPendiente > 0) {
    alertas.push({
      tipo: contexto.resumenFinanciero.porcentajeRecaudo < 60 ? 'error' : 'warning',
      modulo: 'Tesorería',
      mensaje:
        'Faltan por recaudar $' +
        formatearNumeroDashboard_(contexto.resumenFinanciero.valorPendiente) +
        ' del valor esperado del retiro.'
    });
  }

  if (contexto.indicadoresEquipos.sinLider > 0) {
    alertas.push({
      tipo: 'error',
      modulo: 'Equipos',
      mensaje: contexto.indicadoresEquipos.sinLider + ' equipos no tienen líder asignado.'
    });
  }

  if (contexto.indicadoresHabitaciones.conConflicto > 0) {
    alertas.push({
      tipo: 'error',
      modulo: 'Habitaciones',
      mensaje: contexto.indicadoresHabitaciones.conConflicto + ' habitaciones presentan conflictos de asignación.'
    });
  }

  contexto.fechasImportantes
    .filter(function(item) { return item.diasRestantes >= 0 && item.diasRestantes <= 7; })
    .forEach(function(item) {
      alertas.push({
        tipo: item.diasRestantes <= 2 ? 'error' : 'warning',
        modulo: 'Próximas fechas',
        mensaje: item.diasRestantes === 0
          ? 'Hoy: ' + item.descripcion + '.'
          : 'Faltan ' + item.diasRestantes + ' días para ' + item.descripcion.toLowerCase() + '.'
      });
    });

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
/**
 * Lee las fechas clave configuradas para el retiro y calcula su cuenta regresiva.
 */
function obtenerFechasImportantesDashboard() {
  var hoja = obtenerLibro().getSheetByName(HOJAS.FECHAS_IMPORTANTES);

  if (!hoja || hoja.getLastRow() <= 1) {
    return [];
  }

  var datos = hoja.getDataRange().getValues();
  var encabezados = (datos[0] || []).map(convertirEncabezado);
  var indiceFecha = encabezados.indexOf('fecha');
  var indiceDescripcion = encabezados.indexOf('descripcion');
  var indiceActivo = encabezados.indexOf('activo');

  if (indiceFecha < 0 || indiceDescripcion < 0) {
    return [];
  }

  var zonaHoraria = Session.getScriptTimeZone() || 'America/Bogota';
  var hoy = new Date();
  hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  return datos.slice(1)
    .map(function(fila) {
      if (indiceActivo >= 0 && !convertirBooleano(fila[indiceActivo])) {
        return null;
      }

      var fecha = normalizarFechaDashboard_(fila[indiceFecha]);
      var descripcion = String(fila[indiceDescripcion] || '').trim();

      if (!fecha || !descripcion) {
        return null;
      }

      var fechaDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
      var dias = Math.ceil((fechaDia.getTime() - hoy.getTime()) / 86400000);

      return {
        fecha: Utilities.formatDate(fechaDia, zonaHoraria, 'yyyy-MM-dd'),
        fechaTexto: Utilities.formatDate(fechaDia, zonaHoraria, 'dd/MM/yyyy'),
        descripcion: descripcion,
        diasRestantes: dias,
        estado: dias < 0 ? 'vencida' : dias === 0 ? 'hoy' : dias <= 7 ? 'proxima' : 'futura'
      };
    })
    .filter(Boolean)
    .sort(function(a, b) {
      return a.fecha.localeCompare(b.fecha);
    });
}

function normalizarFechaDashboard_(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) {
    return valor;
  }

  var texto = String(valor || '').trim();
  if (!texto) return null;

  var partes = texto.split(/[\/-]/).map(Number);
  if (partes.length === 3) {
    if (partes[0] > 31) return new Date(partes[0], partes[1] - 1, partes[2]);
    return new Date(partes[2], partes[1] - 1, partes[0]);
  }

  var fecha = new Date(texto);
  return isNaN(fecha.getTime()) ? null : fecha;
}

function construirResumenMesasDashboard_(mesas) {
  var totalCapacidad = mesas.reduce(function(total, mesa) {
    return total + Number(mesa.capacidad || 0);
  }, 0);

  var totalAsignados = mesas.reduce(function(total, mesa) {
    return total + Number(mesa.cantidadCaminantes || 0);
  }, 0);

  var cartasRecolectadas = mesas.reduce(function(total, mesa) {
    return total + contarEstadosCompletados((mesa.cartas || {}).estados || {});
  }, 0);

  var fotosRecolectadas = mesas.reduce(function(total, mesa) {
    return total + contarEstadosCompletados((mesa.fotos || {}).estados || {});
  }, 0);

  return {
    totalMesas: mesas.length,
    capacidadTotal: totalCapacidad,
    caminantesAsignados: totalAsignados,
    cuposDisponibles: Math.max(totalCapacidad - totalAsignados, 0),
    mesasCompletas: mesas.filter(function(mesa) {
      return Number(mesa.cantidadCaminantes || 0) === Number(mesa.capacidad || 0);
    }).length,
    mesasIncompletas: mesas.filter(function(mesa) {
      return Number(mesa.cantidadCaminantes || 0) < Number(mesa.capacidad || 0);
    }).length,
    mesasExcedidas: mesas.filter(function(mesa) {
      return Number(mesa.cantidadCaminantes || 0) > Number(mesa.capacidad || 0);
    }).length,
    porcentajeOcupacion: calcularPorcentaje(totalAsignados, totalCapacidad),
    cartasEsperadas: totalAsignados,
    cartasRecolectadas: cartasRecolectadas,
    cartasPendientes: Math.max(totalAsignados - cartasRecolectadas, 0),
    porcentajeCartas: calcularPorcentaje(cartasRecolectadas, totalAsignados),
    fotosEsperadas: totalAsignados,
    fotosRecolectadas: fotosRecolectadas,
    fotosPendientes: Math.max(totalAsignados - fotosRecolectadas, 0),
    porcentajeFotos: calcularPorcentaje(fotosRecolectadas, totalAsignados),
    detalle: mesas.map(function(mesa) {
      var cartas = contarEstadosCompletados((mesa.cartas || {}).estados || {});
      var fotos = contarEstadosCompletados((mesa.fotos || {}).estados || {});
      return {
        numero: mesa.numero,
        capacidad: Number(mesa.capacidad || 0),
        caminantesAsignados: Number(mesa.cantidadCaminantes || 0),
        cartasRecolectadas: cartas,
        fotosRecolectadas: fotos,
        porcentajeOcupacion: Number(mesa.porcentajeOcupacion || 0),
        porcentajeCartas: calcularPorcentaje(cartas, mesa.cantidadCaminantes),
        porcentajeFotos: calcularPorcentaje(fotos, mesa.cantidadCaminantes)
      };
    })
  };
}

function construirResumenFinancieroDashboard_() {
  try {
    var caminantes = construirGrupoReportePagos_('Caminante', {});
    var servidores = construirGrupoReportePagos_('Servidor', {});
    var valorEsperado = caminantes.valorEsperado + servidores.valorEsperado;
    var valorRecaudado = caminantes.valorRecaudado + servidores.valorRecaudado;

    return {
      valorEsperado: valorEsperado,
      valorRecaudado: valorRecaudado,
      valorPendiente: Math.max(valorEsperado - valorRecaudado, 0),
      excedente: caminantes.excedente + servidores.excedente,
      porcentajeRecaudo: calcularPorcentaje(valorRecaudado, valorEsperado),
      caminantes: {
        cantidadPersonas: caminantes.cantidadPersonas,
        valorIndividual: caminantes.valorIndividual,
        valorEsperado: caminantes.valorEsperado,
        valorRecaudado: caminantes.valorRecaudado,
        valorPendiente: caminantes.valorPendiente,
        porcentajeRecaudo: calcularPorcentaje(caminantes.valorRecaudado, caminantes.valorEsperado)
      },
      servidores: {
        cantidadPersonas: servidores.cantidadPersonas,
        valorIndividual: servidores.valorIndividual,
        valorEsperado: servidores.valorEsperado,
        valorRecaudado: servidores.valorRecaudado,
        valorPendiente: servidores.valorPendiente,
        porcentajeRecaudo: calcularPorcentaje(servidores.valorRecaudado, servidores.valorEsperado)
      }
    };
  } catch (error) {
    return {
      valorEsperado: 0,
      valorRecaudado: 0,
      valorPendiente: 0,
      excedente: 0,
      porcentajeRecaudo: 0,
      caminantes: {},
      servidores: {},
      advertencia: error && error.message ? error.message : 'No fue posible calcular el resumen financiero.'
    };
  }
}

function formatearNumeroDashboard_(valor) {
  return Math.round(Number(valor || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function construirPulsoDashboard_(contexto) {
  var c = contexto.indicadoresCaminantes;
  var s = contexto.indicadoresServidores;
  var e = contexto.indicadoresEquipos;
  var p = contexto.indicadoresPresentaciones;
  var h = contexto.indicadoresHabitaciones;
  var m = contexto.resumenMesas;
  var f = contexto.resumenFinanciero;

  function porcentajeSeguro(valor) {
    return Math.max(0, Math.min(Number(valor || 0), 100));
  }

  var asignacionesEsperadas = c.total * 2 + s.total;
  var asignacionesCompletas = asignacionesEsperadas - c.sinMesa - c.sinHabitacion - s.sinHabitacion;
  var preparacionMesas = Math.round(
    (porcentajeSeguro(m.porcentajeOcupacion) +
      porcentajeSeguro(m.porcentajeCartas) +
      porcentajeSeguro(m.porcentajeFotos)) / 3
  );

  var dimensiones = [
    { nombre: 'Inscripciones', valor: porcentajeSeguro(c.porcentajeMeta) },
    { nombre: 'Asignaciones', valor: porcentajeSeguro(calcularPorcentaje(asignacionesCompletas, asignacionesEsperadas)) },
    { nombre: 'Mesas y entregables', valor: preparacionMesas },
    { nombre: 'Equipos', valor: porcentajeSeguro(calcularPorcentaje(e.total - e.sinLider, e.total)) },
    { nombre: 'Audiovisuales', valor: porcentajeSeguro(p.avanceGeneral) },
    { nombre: 'Recaudo', valor: porcentajeSeguro(f.porcentajeRecaudo) },
    { nombre: 'Alojamiento', valor: porcentajeSeguro(calcularPorcentaje(h.total - h.conConflicto, h.total)) }
  ];

  var puntaje = dimensiones.length
    ? Math.round(dimensiones.reduce(function(total, item) { return total + item.valor; }, 0) / dimensiones.length)
    : 0;

  return {
    puntaje: Math.max(0, Math.min(puntaje, 100)),
    estado: puntaje >= 85 ? 'En control' : puntaje >= 65 ? 'Requiere atención' : 'Riesgo operativo',
    dimensiones: dimensiones,
    pendientesOperativos:
      c.sinMesa +
      c.sinHabitacion +
      s.sinHabitacion +
      m.mesasIncompletas +
      m.mesasExcedidas +
      m.cartasPendientes +
      m.fotosPendientes +
      e.sinLider +
      h.conConflicto,
    pagosPendientes: f.valorPendiente,
    personasGestionadas: c.total + s.total,
    proximaFecha: contexto.fechasImportantes.filter(function(item) { return item.diasRestantes >= 0; })[0] || null
  };
}
