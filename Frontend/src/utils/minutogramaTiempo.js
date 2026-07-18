/**
 * Utilidades del minutograma.
 *
 * Reemplaza completamente:
 * src/utils/minutogramaTiempo.js
 */

export function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function convertirFechaMinutograma(valor) {
  if (!valor) return null;

  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }

  if (typeof valor === 'number') {
    // Timestamp de JavaScript.
    if (valor > 100000000000) {
      const fechaTimestamp = new Date(valor);
      return Number.isNaN(fechaTimestamp.getTime()) ? null : fechaTimestamp;
    }

    // Número serial de Google Sheets/Excel.
    if (valor > 0 && valor < 100000) {
      const milisegundosPorDia = 24 * 60 * 60 * 1000;
      const fechaSerial = new Date(Date.UTC(1899, 11, 30) + valor * milisegundosPorDia);
      return Number.isNaN(fechaSerial.getTime()) ? null : fechaSerial;
    }

    const fechaNumero = new Date(valor);
    return Number.isNaN(fechaNumero.getTime()) ? null : fechaNumero;
  }

  const texto = String(valor).trim();
  if (!texto) return null;

  // Formatos ISO o formatos reconocidos nativamente por el navegador.
  const fechaNativa = new Date(texto);
  if (!Number.isNaN(fechaNativa.getTime())) {
    return fechaNativa;
  }

  // Formato habitual de Google Sheets en configuración Colombia:
  // 17/7/2026 0:31:08
  // 17/07/2026 00:31
  const coincidencia = texto.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
  );

  if (!coincidencia) return null;

  const [
    ,
    dia,
    mes,
    anio,
    hora = '0',
    minuto = '0',
    segundo = '0',
  ] = coincidencia;

  const fecha = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(minuto),
    Number(segundo),
    0
  );

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function obtenerValor(actividad, ...campos) {
  for (const campo of campos) {
    const valor = actividad?.[campo];
    if (valor !== undefined && valor !== null && valor !== '') {
      return valor;
    }
  }
  return null;
}

function obtenerNumero(actividad, ...campos) {
  const valor = obtenerValor(actividad, ...campos);
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function obtenerEstado(actividad) {
  return normalizar(
    obtenerValor(
      actividad,
      'estadoEjecucion',
      'estado',
      'Estado',
      'estadoActividad'
    )
  );
}

function obtenerFechaInicioReal(actividad) {
  return convertirFechaMinutograma(
    obtenerValor(
      actividad,
      'fechaInicioReal',
      'fechaHoraInicioReal',
      'Fecha Inicio Real',
      'fecha_inicio_real'
    )
  );
}

function obtenerFechaFinReal(actividad) {
  return convertirFechaMinutograma(
    obtenerValor(
      actividad,
      'fechaFinReal',
      'fechaHoraFinReal',
      'Fecha Fin Real',
      'fecha_fin_real'
    )
  );
}

function obtenerFechaPausaActual(actividad) {
  return convertirFechaMinutograma(
    obtenerValor(
      actividad,
      'fechaPausaActual',
      'fechaHoraPausa',
      'Fecha Pausa Actual',
      'fecha_pausa_actual'
    )
  );
}

function obtenerDuracionMinutos(actividad) {
  return Math.max(
    0,
    obtenerNumero(
      actividad,
      'duracionMinutos',
      'duracion',
      'Duración Minutos',
      'Duracion Minutos',
      'duracionProgramadaMinutos'
    )
  );
}

function obtenerTiempoPausadoSegundos(actividad) {
  return Math.max(
    0,
    obtenerNumero(
      actividad,
      'tiempoPausadoSegundos',
      'Tiempo Pausado Segundos',
      'tiempo_pausado_segundos'
    )
  );
}

export function formatoReloj(segundos, permitirNegativo = false) {
  const valor = Number(segundos);
  const seguro = Number.isFinite(valor) ? Math.trunc(valor) : 0;
  const negativo = seguro < 0;

  const total = Math.abs(
    permitirNegativo ? seguro : Math.max(0, seguro)
  );

  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundosRestantes = total % 60;

  const cuerpo = horas > 0
    ? `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`
    : `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;

  return negativo && permitirNegativo ? `-${cuerpo}` : cuerpo;
}

export function formatoHora(valor) {
  if (!valor) return '--:--';

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  const texto = String(valor).trim();

  // Hora simple: 8:30, 08:30 o 08:30:00.
  const horaSimple = texto.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (horaSimple) {
    return `${String(Number(horaSimple[1])).padStart(2, '0')}:${horaSimple[2]}`;
  }

  const fecha = convertirFechaMinutograma(valor);
  if (fecha) {
    return fecha.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return texto;
}

function segundosTranscurridosDeActividad(actividad, ahora = new Date()) {
  if (!actividad) return 0;

  const inicio = obtenerFechaInicioReal(actividad);
  if (!inicio) return 0;

  const estado = obtenerEstado(actividad);
  const fechaAhora = ahora instanceof Date ? ahora : new Date(ahora);
  const tiempoPausado = obtenerTiempoPausadoSegundos(actividad);

  let referenciaFinal = fechaAhora;

  if (estado === 'pausada') {
    referenciaFinal = obtenerFechaPausaActual(actividad) || fechaAhora;
  } else if (['finalizada', 'finalizado', 'completada', 'completado'].includes(estado)) {
    referenciaFinal = obtenerFechaFinReal(actividad) || fechaAhora;
  }

  const diferencia = Math.floor(
    (referenciaFinal.getTime() - inicio.getTime()) / 1000
  );

  return Math.max(0, diferencia - tiempoPausado);
}

export function calcularEjecucion(actividad, ahora = new Date()) {
  if (!actividad) {
    return {
      duracionSegundos: 0,
      transcurridos: 0,
      restantes: 0,
      porcentaje: 0,
      retraso: false,
      iniciada: false,
      pausada: false,
      finalizada: false,
    };
  }

  const estado = obtenerEstado(actividad);
  const duracionSegundos = obtenerDuracionMinutos(actividad) * 60;
  const inicio = obtenerFechaInicioReal(actividad);

  const iniciada = Boolean(inicio) || [
    'en curso',
    'pausada',
    'finalizada',
    'finalizado',
    'completada',
    'completado',
  ].includes(estado);

  const pausada = estado === 'pausada';
  const finalizada = [
    'finalizada',
    'finalizado',
    'completada',
    'completado',
  ].includes(estado);

  const transcurridos = iniciada
    ? segundosTranscurridosDeActividad(actividad, ahora)
    : 0;

  const restantes = duracionSegundos - transcurridos;
  const porcentaje = duracionSegundos > 0
    ? Math.max(0, Math.min(100, (transcurridos / duracionSegundos) * 100))
    : 0;

  return {
    duracionSegundos,
    transcurridos,
    restantes,
    porcentaje,
    retraso: restantes < 0,
    iniciada,
    pausada,
    finalizada,
  };
}

function obtenerDiaActividad(actividad) {
  return normalizar(
    obtenerValor(
      actividad,
      'dia',
      'Día',
      'Dia',
      'nombreDia'
    )
  );
}

function obtenerOrdenActividad(actividad) {
  return obtenerNumero(actividad, 'orden', 'Orden');
}

function estaActiva(actividad) {
  const activo = obtenerValor(actividad, 'activo', 'Activo');

  if (activo === null) return true;
  if (typeof activo === 'boolean') return activo;

  return !['no', 'false', '0', 'inactivo'].includes(normalizar(activo));
}

function esHoy(actividad, ahora) {
  const diaActividad = obtenerDiaActividad(actividad);
  if (!diaActividad) return true;

  const diaHoy = normalizar(
    ahora.toLocaleDateString('es-CO', { weekday: 'long' })
  );

  return diaActividad === diaHoy;
}

export function seleccionarActividadEnVivo(actividades = [], ahora = new Date()) {
  const lista = Array.isArray(actividades)
    ? actividades.filter(estaActiva)
    : [];

  const actividadesDelDia = lista
    .filter((actividad) => esHoy(actividad, ahora))
    .sort((a, b) => obtenerOrdenActividad(a) - obtenerOrdenActividad(b));

  const enEjecucion = actividadesDelDia.find((actividad) =>
    ['en curso', 'pausada'].includes(obtenerEstado(actividad))
  );

  const pendiente = actividadesDelDia.find((actividad) =>
    ['pendiente', 'programada', 'programado', ''].includes(obtenerEstado(actividad))
  );

  const actual = enEjecucion || pendiente || null;

  let proxima = null;
  if (actual) {
    const indiceActual = actividadesDelDia.findIndex(
      (actividad) => actividad === actual
    );

    proxima = actividadesDelDia
      .slice(indiceActual + 1)
      .find((actividad) =>
        !['finalizada', 'finalizado', 'completada', 'completado'].includes(
          obtenerEstado(actividad)
        )
      ) || null;
  }

  return {
    actual,
    proxima,
    dia: ahora.toLocaleDateString('es-CO', { weekday: 'long' }),
    actividades: actividadesDelDia,
  };
}
