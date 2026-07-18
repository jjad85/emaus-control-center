/**
 * ============================================================
 * MINUTOGRAMA SERVICE - SPRINT 3
 * ============================================================
 */

const DIAS_MINUTOGRAMA = ['Viernes', 'Sábado', 'Domingo'];
const ESTADOS_MINUTOGRAMA = ['Pendiente', 'En curso', 'Pausada', 'Finalizada', 'Cancelada'];
const PRIORIDADES_MINUTOGRAMA = ['Alta', 'Media', 'Baja'];

function obtenerMinutograma(filtros) {
  const parametros = filtros || {};

  return leerHojaComoObjetos(HOJAS.MINUTOGRAMA)
    .filter(function(item) {
      return convertirBooleano(item.activo);
    })
    .map(convertirActividadMinutograma)
    .filter(function(item) {
      return (
        coincideMinutograma(item.dia, parametros.dia) &&
        coincideMinutograma(item.estado, parametros.estado) &&
        coincideMinutograma(item.responsable, parametros.responsable) &&
        coincideMinutograma(item.equipo, parametros.equipo)
      );
    })
    .sort(ordenarMinutograma);
}

function obtenerActividadMinutogramaPorId(id) {
  const actividad = obtenerMinutograma({}).find(function(item) {
    return String(item.id) === String(id);
  });

  if (!actividad) {
    throw crearErrorAplicacion(
      'ACTIVIDAD_NO_ENCONTRADA',
      'No existe la actividad indicada.'
    );
  }

  return actividad;
}

function convertirActividadMinutograma(registro) {
  const horaInicio = normalizarHoraMinutograma(registro.horaInicio);
  const duracionMinutos = convertirNumero(registro.duracionMinutos, 0);

  return {
    id: registro.id,
    orden: convertirNumero(registro.orden, 9999),
    dia: registro.dia,
    horaInicio: horaInicio,
    duracionMinutos: duracionMinutos,
    horaFin: calcularHoraFinMinutograma(horaInicio, duracionMinutos),
    actividad: registro.actividad,
    responsable: registro.responsable,
    equipo: registro.equipo,
    lugar: registro.lugar,
    estado: registro.estado || 'Pendiente',
    prioridad: registro.prioridad || 'Media',
    observaciones: registro.observaciones || '',
    activo: registro.activo,
    fechaRegistro: serializarFechaMinutograma(registro.fechaRegistro),
    fechaActualizacion: serializarFechaMinutograma(registro.fechaActualizacion),
    actualizadoPor: registro.actualizadoPor,

    // Campos de ejecución real introducidos en el Sprint 1.
    fechaInicioReal: serializarFechaMinutograma(registro.fechaInicioReal),
    fechaFinReal: serializarFechaMinutograma(registro.fechaFinReal),
    duracionRealMinutos: convertirNumero(registro.duracionRealMinutos, 0),
    variacionMinutos: convertirNumero(registro.variacionMinutos, 0),
    usuarioInicio: registro.usuarioInicio || '',
    usuarioFin: registro.usuarioFin || '',
    fechaPausaActual: serializarFechaMinutograma(registro.fechaPausaActual),
    tiempoPausadoSegundos: convertirNumero(registro.tiempoPausadoSegundos, 0),
    usuarioPausa: registro.usuarioPausa || '',
    usuarioReanudacion: registro.usuarioReanudacion || '',
    alertasEmitidas: registro.alertasEmitidas || '',
    historialAlertas: registro.historialAlertas || ''
  };
}

function serializarFechaMinutograma(valor) {
  if (!valor) return '';

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return valor.toISOString();
  }

  const fecha = new Date(valor);
  return Number.isFinite(fecha.getTime()) ? fecha.toISOString() : String(valor);
}

function calcularHoraFinMinutograma(horaInicio, duracionMinutos) {
  const minutosInicio = convertirHoraAMinutos(horaInicio);

  if (minutosInicio === null || duracionMinutos <= 0) return '';

  return convertirMinutosAHora((minutosInicio + duracionMinutos) % 1440);
}

function normalizarHoraMinutograma(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      'HH:mm'
    );
  }

  const texto = String(valor || '').trim();
  const coincidencia = texto.match(/(\d{1,2}):(\d{2})/);
  if (!coincidencia) return texto;

  return String(Number(coincidencia[1])).padStart(2, '0') + ':' + coincidencia[2];
}

function convertirHoraAMinutos(hora) {
  const partes = String(hora || '').split(':').map(Number);

  if (
    partes.length !== 2 ||
    partes.some(isNaN) ||
    partes[0] < 0 ||
    partes[0] > 23 ||
    partes[1] < 0 ||
    partes[1] > 59
  ) {
    return null;
  }

  return partes[0] * 60 + partes[1];
}

function convertirMinutosAHora(total) {
  const horas = Math.floor(total / 60);
  const minutos = total % 60;
  return String(horas).padStart(2, '0') + ':' + String(minutos).padStart(2, '0');
}

function ordenarMinutograma(a, b) {
  const prioridadDia = { viernes: 1, sabado: 2, domingo: 3 };
  const diaA = prioridadDia[normalizarTexto(a.dia)] || 99;
  const diaB = prioridadDia[normalizarTexto(b.dia)] || 99;

  if (diaA !== diaB) return diaA - diaB;

  const horaA = convertirHoraAMinutos(a.horaInicio) || 0;
  const horaB = convertirHoraAMinutos(b.horaInicio) || 0;

  if (horaA !== horaB) return horaA - horaB;

  return convertirNumero(a.orden, 9999) - convertirNumero(b.orden, 9999);
}

function coincideMinutograma(valor, filtro) {
  if (!filtro) return true;
  return normalizarTexto(valor) === normalizarTexto(filtro);
}


/**
 * Devuelve un resumen agregado para tableros y pantalla pública.
 */
function obtenerResumenMinutograma(filtros) {
  const parametros = filtros || {};
  const items = obtenerMinutograma(parametros);
  const ahora = new Date();

  const resumen = {
    total: items.length,
    pendientes: 0,
    enCurso: 0,
    pausadas: 0,
    finalizadas: 0,
    canceladas: 0,
    minutosProgramados: 0,
    minutosReales: 0,
    balanceMinutos: 0,
    cumplimientoPorcentaje: 0,
    puntualidadPorcentaje: 0,
    actividadActual: null,
    proximaActividad: null,
    actualizadoEn: ahora.toISOString()
  };

  let finalizadasConMedicion = 0;
  let finalizadasATiempo = 0;

  items.forEach(function(item) {
    const estado = normalizarTexto(item.estado);
    resumen.minutosProgramados += convertirNumero(item.duracionMinutos, 0);

    if (estado === 'pendiente') resumen.pendientes += 1;
    if (estado === 'en curso') resumen.enCurso += 1;
    if (estado === 'pausada') resumen.pausadas += 1;
    if (estado === 'finalizada') resumen.finalizadas += 1;
    if (estado === 'cancelada') resumen.canceladas += 1;

    if (estado === 'finalizada') {
      const real = convertirNumero(item.duracionRealMinutos, 0);
      resumen.minutosReales += real;

      if (item.duracionRealMinutos !== '' && item.duracionRealMinutos !== null) {
        finalizadasConMedicion += 1;
        if (convertirNumero(item.variacionMinutos, 0) >= 0) {
          finalizadasATiempo += 1;
        }
      }
    }
  });

  resumen.balanceMinutos =
    Math.round((resumen.minutosProgramados - resumen.minutosReales) * 100) / 100;

  const ejecutables = items.filter(function(item) {
    return normalizarTexto(item.estado) !== 'cancelada';
  }).length;

  resumen.cumplimientoPorcentaje = ejecutables > 0
    ? Math.round((resumen.finalizadas / ejecutables) * 10000) / 100
    : 0;

  resumen.puntualidadPorcentaje = finalizadasConMedicion > 0
    ? Math.round((finalizadasATiempo / finalizadasConMedicion) * 10000) / 100
    : 0;

  const contexto = obtenerContextoEnVivoMinutograma_(items, ahora);
  resumen.actividadActual = contexto.actividadActual;
  resumen.proximaActividad = contexto.proximaActividad;

  return resumen;
}

function obtenerEstadoEnVivoMinutograma(filtros) {
  const parametros = filtros || {};
  const items = obtenerMinutograma(parametros);
  const ahora = new Date();
  const contexto = obtenerContextoEnVivoMinutograma_(items, ahora);

  return {
    servidorAhora: ahora.toISOString(),
    zonaHoraria: Session.getScriptTimeZone(),
    diaActual: contexto.diaActual,
    actividadActual: contexto.actividadActual,
    proximaActividad: contexto.proximaActividad,
    ultimasFinalizadas: contexto.ultimasFinalizadas
  };
}

function obtenerContextoEnVivoMinutograma_(items, ahora) {
  const nombresDias = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ];

  const diaActual = nombresDias[ahora.getDay()];
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

  const actividadesDia = items
    .filter(function(item) {
      return (
        normalizarTexto(item.dia) === normalizarTexto(diaActual) &&
        normalizarTexto(item.estado) !== 'cancelada'
      );
    })
    .sort(ordenarMinutograma);

  const actividadActual = actividadesDia.find(function(item) {
    const estado = normalizarTexto(item.estado);
    return estado === 'en curso' || estado === 'pausada';
  }) || actividadesDia.find(function(item) {
    const inicio = convertirHoraAMinutos(item.horaInicio);
    const fin = convertirHoraAMinutos(item.horaFin);
    return (
      inicio !== null &&
      fin !== null &&
      minutosActuales >= inicio &&
      minutosActuales < fin &&
      normalizarTexto(item.estado) !== 'finalizada'
    );
  }) || null;

  const proximaActividad = actividadesDia.find(function(item) {
    const inicio = convertirHoraAMinutos(item.horaInicio);
    return (
      inicio !== null &&
      inicio > minutosActuales &&
      normalizarTexto(item.estado) === 'pendiente'
    );
  }) || null;

  const ultimasFinalizadas = actividadesDia
    .filter(function(item) {
      return normalizarTexto(item.estado) === 'finalizada';
    })
    .sort(function(a, b) {
      const fechaA = new Date(a.fechaFinReal || 0).getTime();
      const fechaB = new Date(b.fechaFinReal || 0).getTime();
      return fechaB - fechaA;
    })
    .slice(0, 3);

  return {
    diaActual: diaActual,
    actividadActual: actividadActual,
    proximaActividad: proximaActividad,
    ultimasFinalizadas: ultimasFinalizadas
  };
}
