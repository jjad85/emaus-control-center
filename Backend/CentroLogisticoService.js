/**
 * Consolida la información operativa requerida por el Centro Logístico.
 * No incluye pagos ni datos de tesorería.
 */
function obtenerCentroLogistico(token) {
  validarPermiso(token, 'CENTRO_LOGISTICO_VER');

  var caminantes = obtenerCaminantes({});
  var servidores = obtenerServidores({});
  var habitaciones = obtenerHabitaciones();
  var mesas = obtenerMesas();

  var estados = ['Pendiente', 'Solicitada', 'Entregada', 'Empaquetada', 'Entregada a Logística'];
  var cartas = crearConteoEstadosLogisticos_(estados);
  var fotos = crearConteoEstadosLogisticos_(estados);
  var tallas = {};
  var alimentacion = [];

  caminantes.forEach(function(item) {
    incrementarConteoLogistico_(cartas, item.entregables && item.entregables.carta);
    incrementarConteoLogistico_(fotos, item.entregables && item.entregables.foto);
    incrementarConteoLogistico_(tallas, item.tallaCamiseta || 'Sin talla');

    if (normalizarTexto(item.tieneCondicionAlimentaria) === 'si') {
      alimentacion.push({
        id: item.id || '',
        nombre: item.nombre || '',
        telefono: item.telefono || '',
        mesa: item.mesa || '',
        habitacion: item.habitacion || '',
        alergias: item.alergiasAlimentarias || item.alergias || '',
        restricciones: item.restriccionesAlimentarias || '',
        preferencias: item.preferenciasAlimentarias || '',
        dietaEspecial: item.dietaEspecial || ''
      });
    }
  });

  servidores.forEach(function(item) {
    incrementarConteoLogistico_(tallas, item.tallaCamiseta || item.talla || 'Sin talla');
  });

  cartas.aprobadas = caminantes.filter(function(item) {
    return Boolean(String(
      item.entregables &&
      item.entregables.aprobacionCartaLogistica &&
      item.entregables.aprobacionCartaLogistica.aprobadoPor || ''
    ).trim());
  }).length;

  fotos.aprobadas = caminantes.filter(function(item) {
    return Boolean(String(
      item.entregables &&
      item.entregables.aprobacionFotoLogistica &&
      item.entregables.aprobacionFotoLogistica.aprobadoPor || ''
    ).trim());
  }).length;

  cartas.pendientesAprobacion = Math.max((cartas['Entregada a Logística'] || 0) - cartas.aprobadas, 0);
  fotos.pendientesAprobacion = Math.max((fotos['Entregada a Logística'] || 0) - fotos.aprobadas, 0);

  var caminantesSinMesa = caminantes.filter(function(item) {
    return !String(item.mesa || '').trim();
  }).length;
  var caminantesSinHabitacion = caminantes.filter(function(item) {
    return !String(item.habitacion || '').trim();
  }).length;

  var indicadoresMesas = {
    total: mesas.length,
    completas: mesas.filter(function(item) { return Number(item.cuposDisponibles || 0) === 0; }).length,
    conCupos: mesas.filter(function(item) { return Number(item.cuposDisponibles || 0) > 0; }).length,
    excedidas: mesas.filter(function(item) { return Boolean(item.excedida); }).length,
    caminantesSinMesa: caminantesSinMesa
  };

  var indicadoresHabitaciones = {
    total: habitaciones.length,
    completas: habitaciones.filter(function(item) { return Number(item.cuposDisponibles || 0) === 0 && Number(item.ocupantes || 0) > 0; }).length,
    conCupos: habitaciones.filter(function(item) { return Number(item.cuposDisponibles || 0) > 0; }).length,
    sinAsignar: habitaciones.filter(function(item) { return Number(item.ocupantes || 0) === 0; }).length,
    conflictos: habitaciones.filter(function(item) { return Boolean(item.conflictoAsignacion); }).length,
    caminantesSinHabitacion: caminantesSinHabitacion
  };

  var tabla = caminantes.map(function(item) {
    var carta = item.entregables && item.entregables.carta || 'Pendiente';
    var foto = item.entregables && item.entregables.foto || 'Pendiente';
    var condicion = normalizarTexto(item.tieneCondicionAlimentaria) === 'si';
    return {
      id: item.id || '',
      nombre: item.nombre || '',
      telefono: item.telefono || '',
      mesa: item.mesa || '',
      habitacion: item.habitacion || '',
      tallaCamiseta: item.tallaCamiseta || '',
      carta: carta,
      foto: foto,
      cartaAprobada: Boolean(String(item.entregables && item.entregables.aprobacionCartaLogistica && item.entregables.aprobacionCartaLogistica.aprobadoPor || '').trim()),
      fotoAprobada: Boolean(String(item.entregables && item.entregables.aprobacionFotoLogistica && item.entregables.aprobacionFotoLogistica.aprobadoPor || '').trim()),
      tieneCondicionAlimentaria: condicion ? 'Sí' : 'No',
      detalleAlimentacion: construirDetalleAlimentacionLogistica_(item),
      completo: Boolean(String(item.mesa || '').trim()) &&
        Boolean(String(item.habitacion || '').trim()) &&
        esEntregableCompletoLogistica_(carta, item.entregables && item.entregables.aprobacionCartaLogistica) &&
        esEntregableCompletoLogistica_(foto, item.entregables && item.entregables.aprobacionFotoLogistica)
    };
  });

  var totalCaminantes = caminantes.length;
  var avanceMesa = calcularPorcentaje(totalCaminantes - caminantesSinMesa, totalCaminantes);
  var avanceHabitacion = calcularPorcentaje(totalCaminantes - caminantesSinHabitacion, totalCaminantes);
  var avanceCarta = calcularAvanceEntregableLogistico_(caminantes, 'carta');
  var avanceFoto = calcularAvanceEntregableLogistico_(caminantes, 'foto');
  var pulso = Math.round((avanceMesa + avanceHabitacion + avanceCarta + avanceFoto) / 4);

  return {
    resumen: {
      caminantes: totalCaminantes,
      servidores: servidores.length,
      participantes: totalCaminantes + servidores.length,
      pulsoLogistico: pulso
    },
    avances: {
      mesas: avanceMesa,
      habitaciones: avanceHabitacion,
      cartas: avanceCarta,
      fotografias: avanceFoto
    },
    entregables: {
      cartas: cartas,
      fotos: fotos
    },
    tallas: ordenarTallasLogisticas_(tallas),
    alimentacion: {
      totalConCondicion: alimentacion.length,
      personas: alimentacion
    },
    habitaciones: {
      indicadores: indicadoresHabitaciones,
      items: habitaciones.map(function(item) {
        return {
          habitacion: item.habitacion || item.id || '',
          bloque: item.bloque || '',
          piso: item.piso || '',
          capacidad: item.capacidad || 0,
          ocupantes: item.ocupantes || 0,
          cuposDisponibles: item.cuposDisponibles || 0,
          estado: item.estado || '',
          conflictoAsignacion: Boolean(item.conflictoAsignacion)
        };
      })
    },
    mesas: {
      indicadores: indicadoresMesas,
      items: mesas.map(function(item) {
        return {
          numero: item.numero,
          capacidad: item.capacidad || 0,
          cantidadCaminantes: item.cantidadCaminantes || 0,
          cuposDisponibles: item.cuposDisponibles || 0,
          porcentajeOcupacion: item.porcentajeOcupacion || 0,
          excedida: Boolean(item.excedida)
        };
      })
    },
    caminantes: tabla
  };
}

function crearConteoEstadosLogisticos_(estados) {
  var resultado = {};
  estados.forEach(function(estado) { resultado[estado] = 0; });
  return resultado;
}

function incrementarConteoLogistico_(mapa, valor) {
  var clave = String(valor || 'Pendiente').trim() || 'Pendiente';
  mapa[clave] = Number(mapa[clave] || 0) + 1;
}

function construirDetalleAlimentacionLogistica_(item) {
  return [
    item.alergiasAlimentarias || item.alergias || '',
    item.restriccionesAlimentarias || '',
    item.preferenciasAlimentarias || '',
    item.dietaEspecial || ''
  ].filter(function(valor) { return Boolean(String(valor || '').trim()); }).join(' · ');
}

function esEntregableCompletoLogistica_(estado, aprobacion) {
  var estadoNormalizado = normalizarTexto(estado);
  if (estadoNormalizado === normalizarTexto('Entregada a Logística')) {
    return Boolean(String(aprobacion && aprobacion.aprobadoPor || '').trim());
  }
  return estadoNormalizado === normalizarTexto('Empaquetada');
}

function calcularAvanceEntregableLogistico_(caminantes, campo) {
  if (!caminantes.length) return 0;
  var completados = caminantes.filter(function(item) {
    var entregables = item.entregables || {};
    var aprobacion = campo === 'carta'
      ? entregables.aprobacionCartaLogistica
      : entregables.aprobacionFotoLogistica;
    return esEntregableCompletoLogistica_(entregables[campo], aprobacion);
  }).length;
  return calcularPorcentaje(completados, caminantes.length);
}

function ordenarTallasLogisticas_(tallas) {
  var orden = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Sin talla'];
  var resultado = [];
  orden.forEach(function(talla) {
    if (Number(tallas[talla] || 0) > 0) resultado.push({ talla: talla, cantidad: tallas[talla] });
  });
  Object.keys(tallas).sort().forEach(function(talla) {
    if (orden.indexOf(talla) < 0) resultado.push({ talla: talla, cantidad: tallas[talla] });
  });
  return resultado;
}
