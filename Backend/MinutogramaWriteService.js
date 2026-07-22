/**
 * ============================================================
 * MINUTOGRAMA WRITE SERVICE - SPRINT 3
 * ============================================================
 */

function registrarActividadMinutograma(token, datos) {
  const sesion = validarPermiso(token, 'CREAR_ACTIVIDADES_PASO_A_PASO');

  return ejecutarCrudConBloqueo(function() {
    const registro = prepararActividadMinutograma(datos);
    validarActividadMinutograma(registro);

    const existentesDia = obtenerMinutograma({ dia: registro.dia });
    registro.orden = existentesDia.length + 1;
    const creado = crearRegistroSheet(
      HOJAS.MINUTOGRAMA,
      registro,
      opcionesCrudMinutograma(sesion.usuario)
    );
    recalcularProgramacionDiaMinutograma_(registro.dia, sesion.usuario);

    auditarMinutograma(sesion, 'CREAR_ACTIVIDADES_PASO_A_PASO', creado.id, creado);
    return convertirActividadMinutograma(creado);
  });
}

function editarActividadMinutograma(token, id, datos) {
  const sesion = validarPermiso(token, 'EDITAR_ACTIVIDAD_PASO_A_PASO');

  return ejecutarCrudConBloqueo(function() {
    const anterior = leerRegistroPorIdSheet(
      HOJAS.MINUTOGRAMA,
      id,
      opcionesCrudMinutograma(sesion.usuario)
    );

    const registro = prepararActividadMinutograma(datos);
    validarActividadMinutograma(registro);

    const actualizado = actualizarRegistroSheet(
      HOJAS.MINUTOGRAMA,
      id,
      registro,
      opcionesCrudMinutograma(sesion.usuario)
    );

    recalcularProgramacionDiaMinutograma_(registro.dia, sesion.usuario);
    if (anterior.dia && normalizarTexto(anterior.dia) !== normalizarTexto(registro.dia)) {
      recalcularProgramacionDiaMinutograma_(anterior.dia, sesion.usuario);
    }

    auditarMinutograma(sesion, 'EDITAR_ACTIVIDAD_PASO_A_PASO', id, {
      anterior: anterior,
      nuevo: actualizado
    });

    return convertirActividadMinutograma(actualizado);
  });
}

/**
 * Conserva la acción pública existente, pero aplica permisos granulares.
 * - En curso: INICIAR_ACTIVIDAD_PASO_A_PASO
 * - Finalizada: FINALIZAR_ACTIVIDAD_PASO_A_PASO
 * - Otros estados: ACTUALIZAR_ESTADO_PASO_A_PASO
 */
function actualizarEstadoMinutograma(token, id, estado) {
  const valor = estandarizarOpcionMinutograma(estado, ESTADOS_MINUTOGRAMA);

  if (!valor) {
    throw crearErrorAplicacion(
      'ESTADO_MINUTOGRAMA_INVALIDO',
      'El estado seleccionado no es válido.'
    );
  }

  if (valor === 'En curso') {
    return iniciarActividadMinutograma(token, id);
  }

  if (valor === 'Pausada') {
    return pausarActividadMinutograma(token, id);
  }

  if (valor === 'Finalizada') {
    return finalizarActividadMinutograma(token, id);
  }

  const sesion = validarPermiso(token, 'ACTUALIZAR_ESTADO_PASO_A_PASO');

  const actualizado = ejecutarCrudConBloqueo(function() {
    return actualizarRegistroSheet(
      HOJAS.MINUTOGRAMA,
      id,
      { estado: valor },
      opcionesCrudMinutograma(sesion.usuario)
    );
  });

  auditarMinutograma(sesion, 'ACTUALIZAR_ESTADO_PASO_A_PASO', id, { estado: valor });
  return convertirActividadMinutograma(actualizado);
}

function iniciarActividadMinutograma(token, id) {
  const sesion = validarPermiso(token, 'INICIAR_ACTIVIDAD_PASO_A_PASO');

  return ejecutarCrudConBloqueo(function() {
    const actividad = leerRegistroPorIdSheet(
      HOJAS.MINUTOGRAMA,
      id,
      opcionesCrudMinutograma(sesion.usuario)
    );

    if (normalizarTexto(actividad.estado) === 'finalizada') {
      throw crearErrorAplicacion(
        'ACTIVIDAD_YA_FINALIZADA',
        'La actividad ya fue finalizada.'
      );
    }

    const otraEnCurso = obtenerMinutograma({}).find(function(item) {
      const estado = normalizarTexto(item.estado);
      return (
        (estado === 'en curso' || estado === 'pausada') &&
        String(item.id) !== String(id)
      );
    });

    if (otraEnCurso) {
      throw crearErrorAplicacion(
        'OTRA_ACTIVIDAD_EN_CURSO',
        'Ya existe una actividad en curso: ' + otraEnCurso.actividad
      );
    }

    const ahora = new Date();
    const actualizado = actualizarRegistroSheet(
      HOJAS.MINUTOGRAMA,
      id,
      {
        estado: 'En curso',
        fechaInicioReal: actividad.fechaInicioReal || ahora,
        fechaFinReal: '',
        duracionRealMinutos: '',
        variacionMinutos: '',
        usuarioInicio: actividad.usuarioInicio || sesion.usuario,
        usuarioFin: '',
        fechaPausaActual: '',
        tiempoPausadoSegundos: convertirNumero(actividad.tiempoPausadoSegundos, 0),
        usuarioPausa: '',
        usuarioReanudacion: '',
        alertasEmitidas: '',
        historialAlertas: ''
      },
      opcionesCrudMinutograma(sesion.usuario)
    );

    auditarMinutograma(sesion, 'INICIAR_ACTIVIDAD_PASO_A_PASO', id, actualizado);
    return convertirActividadMinutograma(actualizado);
  });
}


function pausarActividadMinutograma(token, id) {
  const sesion = validarPermiso(token, 'PAUSAR_ACTIVIDAD_PASO_A_PASO');

  return ejecutarCrudConBloqueo(function() {
    const actividad = leerRegistroPorIdSheet(
      HOJAS.MINUTOGRAMA,
      id,
      opcionesCrudMinutograma(sesion.usuario)
    );

    if (normalizarTexto(actividad.estado) !== 'en curso') {
      throw crearErrorAplicacion(
        'ACTIVIDAD_NO_ESTA_EN_CURSO',
        'Solo se puede pausar una actividad que esté en curso.'
      );
    }

    const actualizado = actualizarRegistroSheet(
      HOJAS.MINUTOGRAMA,
      id,
      {
        estado: 'Pausada',
        fechaPausaActual: new Date(),
        usuarioPausa: sesion.usuario
      },
      opcionesCrudMinutograma(sesion.usuario)
    );

    auditarMinutograma(sesion, 'PAUSAR_ACTIVIDAD_PASO_A_PASO', id, actualizado);
    return convertirActividadMinutograma(actualizado);
  });
}

function reanudarActividadMinutograma(token, id) {
  const sesion = validarPermiso(token, 'REANUDAR_ACTIVIDAD_PASO_A_PASO');

  return ejecutarCrudConBloqueo(function() {
    const actividad = leerRegistroPorIdSheet(
      HOJAS.MINUTOGRAMA,
      id,
      opcionesCrudMinutograma(sesion.usuario)
    );

    if (normalizarTexto(actividad.estado) !== 'pausada') {
      throw crearErrorAplicacion(
        'ACTIVIDAD_NO_ESTA_PAUSADA',
        'Solo se puede reanudar una actividad que esté pausada.'
      );
    }

    const fechaPausa = new Date(actividad.fechaPausaActual);
    if (!Number.isFinite(fechaPausa.getTime())) {
      throw crearErrorAplicacion(
        'FECHA_PAUSA_INVALIDA',
        'No fue posible determinar cuándo inició la pausa.'
      );
    }

    const ahora = new Date();
    const pausaActualSegundos = Math.max(
      0,
      Math.floor((ahora.getTime() - fechaPausa.getTime()) / 1000)
    );

    const actualizado = actualizarRegistroSheet(
      HOJAS.MINUTOGRAMA,
      id,
      {
        estado: 'En curso',
        fechaPausaActual: '',
        tiempoPausadoSegundos:
          convertirNumero(actividad.tiempoPausadoSegundos, 0) +
          pausaActualSegundos,
        usuarioReanudacion: sesion.usuario
      },
      opcionesCrudMinutograma(sesion.usuario)
    );

    auditarMinutograma(sesion, 'REANUDAR_ACTIVIDAD_PASO_A_PASO', id, {
      pausaActualSegundos: pausaActualSegundos,
      actividad: actualizado
    });

    return convertirActividadMinutograma(actualizado);
  });
}

function finalizarActividadMinutograma(token, id) {
  const sesion = validarPermiso(token, 'FINALIZAR_ACTIVIDAD_PASO_A_PASO');

  return ejecutarCrudConBloqueo(function() {
    const actividad = leerRegistroPorIdSheet(
      HOJAS.MINUTOGRAMA,
      id,
      opcionesCrudMinutograma(sesion.usuario)
    );

    const estadoActual = normalizarTexto(actividad.estado);

    if (estadoActual !== 'en curso' && estadoActual !== 'pausada') {
      throw crearErrorAplicacion(
        'ACTIVIDAD_NO_EJECUTABLE',
        'Solo se puede finalizar una actividad en curso o pausada.'
      );
    }

    if (!actividad.fechaInicioReal) {
      throw crearErrorAplicacion(
        'ACTIVIDAD_NO_INICIADA',
        'Debe iniciar la actividad antes de finalizarla.'
      );
    }

    const inicio = new Date(actividad.fechaInicioReal);
    const fin = new Date();

    if (!Number.isFinite(inicio.getTime())) {
      throw crearErrorAplicacion(
        'FECHA_INICIO_REAL_INVALIDA',
        'La fecha real de inicio no es válida.'
      );
    }

    let tiempoPausadoSegundos =
      convertirNumero(actividad.tiempoPausadoSegundos, 0);

    if (
      normalizarTexto(actividad.estado) === 'pausada' &&
      actividad.fechaPausaActual
    ) {
      const fechaPausaActual = new Date(actividad.fechaPausaActual);
      if (Number.isFinite(fechaPausaActual.getTime())) {
        tiempoPausadoSegundos += Math.max(
          0,
          Math.floor((fin.getTime() - fechaPausaActual.getTime()) / 1000)
        );
      }
    }

    const duracionRealSegundos = Math.max(
      0,
      Math.floor((fin.getTime() - inicio.getTime()) / 1000) -
        tiempoPausadoSegundos
    );

    const duracionRealMinutos =
      Math.round((duracionRealSegundos / 60) * 100) / 100;

    const duracionProgramada = convertirNumero(actividad.duracionMinutos, 0);
    const variacionMinutos = Math.round(
      (duracionProgramada - duracionRealMinutos) * 100
    ) / 100;

    const actualizado = actualizarRegistroSheet(
      HOJAS.MINUTOGRAMA,
      id,
      {
        estado: 'Finalizada',
        fechaFinReal: fin,
        duracionRealMinutos: duracionRealMinutos,
        variacionMinutos: variacionMinutos,
        usuarioFin: sesion.usuario,
        fechaPausaActual: '',
        tiempoPausadoSegundos: tiempoPausadoSegundos
      },
      opcionesCrudMinutograma(sesion.usuario)
    );

    auditarMinutograma(sesion, 'FINALIZAR_ACTIVIDAD_PASO_A_PASO', id, actualizado);
    return convertirActividadMinutograma(actualizado);
  });
}


function registrarAlertaMinutograma(token, id, tipo, mensaje) {
  const sesion = validarPermiso(
    token,
    'REGISTRAR_ALERTA_MINUTOGRAMA'
  );

  const tiposPermitidos = ['50', '75', '5MIN', 'AGOTADO'];
  const tipoNormalizado = String(tipo || '').trim().toUpperCase();

  if (tiposPermitidos.indexOf(tipoNormalizado) === -1) {
    throw crearErrorAplicacion(
      'TIPO_ALERTA_INVALIDO',
      'El tipo de alerta indicado no es válido.'
    );
  }

  return ejecutarCrudConBloqueo(function() {
    const actividad = leerRegistroPorIdSheet(
      HOJAS.MINUTOGRAMA,
      id,
      opcionesCrudMinutograma(sesion.usuario)
    );

    const emitidas = String(actividad.alertasEmitidas || '')
      .split(',')
      .map(function(item) { return item.trim(); })
      .filter(Boolean);

    if (emitidas.indexOf(tipoNormalizado) !== -1) {
      return convertirActividadMinutograma(actividad);
    }

    const jerarquiaAlertas = {
      '50': ['50'],
      '75': ['50', '75'],
      '5MIN': ['50', '75', '5MIN'],
      'AGOTADO': ['50', '75', '5MIN', 'AGOTADO']
    };

    jerarquiaAlertas[tipoNormalizado].forEach(function(tipoIncluido) {
      if (emitidas.indexOf(tipoIncluido) === -1) {
        emitidas.push(tipoIncluido);
      }
    });

    const ahora = new Date();
    const marcaTiempo = Utilities.formatDate(
      ahora,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd HH:mm:ss'
    );

    const historialAnterior = String(actividad.historialAlertas || '').trim();
    const nuevaEntrada = [
      marcaTiempo,
      tipoNormalizado,
      sesion.usuario,
      String(mensaje || '').trim()
    ].join(' | ');

    const actualizado = actualizarRegistroSheet(
      HOJAS.MINUTOGRAMA,
      id,
      {
        alertasEmitidas: emitidas.join(','),
        historialAlertas: historialAnterior
          ? historialAnterior + '\n' + nuevaEntrada
          : nuevaEntrada
      },
      opcionesCrudMinutograma(sesion.usuario)
    );

    auditarMinutograma(sesion, 'REGISTRAR_ALERTA_MINUTOGRAMA', id, {
      tipo: tipoNormalizado,
      mensaje: mensaje || ''
    });

    return convertirActividadMinutograma(actualizado);
  });
}

function desactivarActividadMinutograma(token, id) {
  const sesion = validarPermiso(token, 'ELIMINAR_ACTIVIDAD_PASO_A_PASO');

  const actualizado = ejecutarCrudConBloqueo(function() {
    return desactivarRegistroSheet(
      HOJAS.MINUTOGRAMA,
      id,
      opcionesCrudMinutograma(sesion.usuario)
    );
  });

  auditarMinutograma(sesion, 'ELIMINAR_ACTIVIDAD_PASO_A_PASO', id, actualizado);
  return convertirActividadMinutograma(actualizado);
}

function prepararActividadMinutograma(datos) {
  const entrada = datos || {};

  return {
    orden:
      entrada.orden === '' || entrada.orden === null || entrada.orden === undefined
        ? 9999
        : convertirNumero(entrada.orden, 9999),
    dia: estandarizarOpcionMinutograma(entrada.dia, DIAS_MINUTOGRAMA),
    horaInicio: normalizarHoraMinutograma(entrada.horaInicio),
    duracionMinutos: convertirNumero(entrada.duracionMinutos, 0),
    actividad: String(entrada.actividad || '').trim(),
    responsable: String(entrada.responsable || '').trim(),
    equipo: String(entrada.equipo || '').trim(),
    lugar: String(entrada.lugar || '').trim(),
    estado: estandarizarOpcionMinutograma(
      entrada.estado || 'Pendiente',
      ESTADOS_MINUTOGRAMA
    ),
    prioridad: estandarizarOpcionMinutograma(
      entrada.prioridad || 'Media',
      PRIORIDADES_MINUTOGRAMA
    ),
    observaciones: String(entrada.observaciones || '').trim()
  };
}

function validarActividadMinutograma(registro) {
  if (!registro.dia) {
    throw crearErrorAplicacion('DIA_MINUTOGRAMA_REQUERIDO', 'Debe seleccionar el día.');
  }
  if (convertirHoraAMinutos(registro.horaInicio) === null) {
    throw crearErrorAplicacion('HORA_INICIO_INVALIDA', 'La hora de inicio no es válida.');
  }
  if (registro.duracionMinutos <= 0) {
    throw crearErrorAplicacion('DURACION_INVALIDA', 'La duración debe ser mayor que cero.');
  }
  if (!registro.actividad) {
    throw crearErrorAplicacion('ACTIVIDAD_REQUERIDA', 'Debe ingresar la actividad.');
  }
  if (!registro.responsable) {
    throw crearErrorAplicacion('RESPONSABLE_REQUERIDO', 'Debe ingresar el responsable.');
  }
  if (!registro.lugar) {
    throw crearErrorAplicacion('LUGAR_REQUERIDO', 'Debe ingresar el lugar.');
  }
  if (!registro.estado) {
    throw crearErrorAplicacion('ESTADO_MINUTOGRAMA_INVALIDO', 'El estado no es válido.');
  }
  if (!registro.prioridad) {
    throw crearErrorAplicacion('PRIORIDAD_MINUTOGRAMA_INVALIDA', 'La prioridad no es válida.');
  }
}

function opcionesCrudMinutograma(usuario) {
  return {
    campoId: 'id',
    campoActivo: 'activo',
    campoFechaRegistro: 'fechaRegistro',
    campoFechaActualizacion: 'fechaActualizacion',
    campoActualizadoPor: 'actualizadoPor',
    valorActivo: 'Sí',
    valorInactivo: 'No',
    usuario: usuario || ''
  };
}

function estandarizarOpcionMinutograma(valor, opciones) {
  const buscado = normalizarTexto(valor);
  return opciones.find(function(opcion) {
    return normalizarTexto(opcion) === buscado;
  }) || '';
}

function auditarMinutograma(sesion, accion, id, detalle) {
  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre,
    accion: accion,
    entidad: 'Minutograma',
    idRegistro: id,
    detalle: JSON.stringify(detalle)
  });
}

/** Importa el paso a paso completo. El orden de las filas define la secuencia. */
function importarActividadesMinutograma(token, actividades) {
  const sesion = validarPermiso(token, 'IMPORTAR_ACTIVIDADES_PASO_A_PASO');
  const filas = Array.isArray(actividades) ? actividades : [];
  if (!filas.length) {
    throw crearErrorAplicacion('IMPORTACION_VACIA', 'El archivo no contiene actividades para importar.');
  }

  return ejecutarCrudConBloqueo(function() {
    const creadas = [];
    const contadorDia = {};

    filas.forEach(function(datos, indice) {
      const registro = prepararActividadMinutograma(datos);
      validarActividadMinutograma(registro);
      contadorDia[registro.dia] = (contadorDia[registro.dia] || 0) + 1;
      registro.orden = contadorDia[registro.dia];
      registro.estado = 'Pendiente';

      const creado = crearRegistroSheet(
        HOJAS.MINUTOGRAMA,
        registro,
        opcionesCrudMinutograma(sesion.usuario)
      );
      creadas.push(creado);
    });

    Object.keys(contadorDia).forEach(function(dia) {
      recalcularProgramacionDiaMinutograma_(dia, sesion.usuario);
    });

    auditarMinutograma(sesion, 'IMPORTAR_ACTIVIDADES_PASO_A_PASO', '', {
      cantidad: creadas.length
    });

    return { cantidad: creadas.length };
  });
}

/** Reordena visualmente las actividades de un día y recalcula todas las horas. */
function reordenarActividadesMinutograma(token, dia, ids) {
  const sesion = validarPermiso(token, 'MOVER_ACTIVIDADES_PASO_A_PASO');
  const listaIds = Array.isArray(ids) ? ids.map(String) : [];
  if (!dia || !listaIds.length) {
    throw crearErrorAplicacion('ORDEN_INVALIDO', 'No se recibió un orden válido.');
  }

  return ejecutarCrudConBloqueo(function() {
    const actuales = leerHojaComoObjetos(HOJAS.MINUTOGRAMA)
      .filter(function(item) {
        return convertirBooleano(item.activo) && normalizarTexto(item.dia) === normalizarTexto(dia);
      })
      .sort(function(a, b) {
        return convertirNumero(a.orden, 9999) - convertirNumero(b.orden, 9999);
      });

    const idsActuales = actuales.map(function(item) { return String(item.id); });
    if (listaIds.length !== idsActuales.length || listaIds.some(function(id) { return idsActuales.indexOf(id) < 0; })) {
      throw crearErrorAplicacion('ORDEN_INCOMPLETO', 'El orden recibido no contiene todas las actividades del día. Actualiza la página e intenta nuevamente.');
    }

    let ultimoIndiceBloqueado = -1;
    actuales.forEach(function(item, indice) {
      if (normalizarTexto(item.estado) !== 'pendiente') ultimoIndiceBloqueado = indice;
    });

    for (let indice = 0; indice <= ultimoIndiceBloqueado; indice += 1) {
      if (listaIds[indice] !== idsActuales[indice]) {
        throw crearErrorAplicacion(
          'ACTIVIDADES_EJECUTADAS_BLOQUEADAS',
          'No puedes insertar ni mover actividades antes o entre actividades que ya fueron ejecutadas.'
        );
      }
    }

    const porId = {};
    actuales.forEach(function(item) {
      porId[String(item.id)] = item;
    });

    const primeraActual = porId[listaIds[0]];
    let minutoActual = convertirHoraAMinutos(
      normalizarHoraMinutograma(primeraActual && primeraActual.horaInicio)
    );
    if (minutoActual === null) minutoActual = 0;

    const actualizadas = listaIds.map(function(id, indice) {
      const actividad = porId[id];
      const horaInicio = convertirMinutosAHora(minutoActual % 1440);

      const actualizado = actualizarRegistroSheet(
        HOJAS.MINUTOGRAMA,
        id,
        {
          orden: indice + 1,
          horaInicio: horaInicio
        },
        opcionesCrudMinutograma(sesion.usuario)
      );

      minutoActual += convertirNumero(actividad.duracionMinutos, 0);

      return Object.assign({}, actividad, actualizado, {
        orden: indice + 1,
        horaInicio: horaInicio
      });
    });

    SpreadsheetApp.flush();

    auditarMinutograma(sesion, 'MOVER_ACTIVIDADES_PASO_A_PASO', '', {
      dia: dia,
      ids: listaIds
    });
    return actualizadas.map(convertirActividadMinutograma);
  });
}

/**
 * Conserva la hora de la primera actividad del día y encadena las siguientes
 * usando la duración de la actividad anterior.
 */
function recalcularProgramacionDiaMinutograma_(dia, usuario) {
  const actividades = leerHojaComoObjetos(HOJAS.MINUTOGRAMA)
    .filter(function(item) {
      return convertirBooleano(item.activo) && normalizarTexto(item.dia) === normalizarTexto(dia);
    })
    .sort(function(a, b) {
      return convertirNumero(a.orden, 9999) - convertirNumero(b.orden, 9999);
    });

  if (!actividades.length) return [];

  let minutoActual = convertirHoraAMinutos(normalizarHoraMinutograma(actividades[0].horaInicio));
  if (minutoActual === null) minutoActual = 0;

  return actividades.map(function(actividad, indice) {
    const horaInicio = convertirMinutosAHora(minutoActual % 1440);
    const actualizado = actualizarRegistroSheet(
      HOJAS.MINUTOGRAMA,
      actividad.id,
      {
        orden: indice + 1,
        horaInicio: horaInicio
      },
      opcionesCrudMinutograma(usuario)
    );
    minutoActual += convertirNumero(actividad.duracionMinutos, 0);
    return actualizado;
  });
}
