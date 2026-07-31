/**
 * ENTREGA 3 - Gestión de palancas por Logística.
 */
const PERMISO_GESTIONAR_PALANCAS_LOGISTICA = 'GESTIONAR_PALANCAS_LOGISTICA';
const ESTADOS_PALANCA_LOGISTICA = [
  'Pendiente de información',
  'Solicitada',
  'En preparación',
  'Preparada',
  'Pendiente de validación',
  'Requiere ajuste',
  'Aprobada por Logística',
  'Entregada para ejecución'
];

function obtenerGestionPalancasLogistica(token) {
  validarPermisoPalancasLogistica_(token);
  const items = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(''))
    .filter(function(registro) { return convertirBooleano(registro.activo) && convertirBooleano(registro.requierePalanca); })
    .map(convertirPalancaLogistica_);

  items.sort(function(a, b) {
    const ordenA = ESTADOS_PALANCA_LOGISTICA.indexOf(a.estado);
    const ordenB = ESTADOS_PALANCA_LOGISTICA.indexOf(b.estado);
    if (ordenA !== ordenB) return ordenA - ordenB;
    return String(a.diaDelTema || '').localeCompare(String(b.diaDelTema || '')) ||
      String(a.horaPropuesta || '').localeCompare(String(b.horaPropuesta || ''));
  });

  const resumen = { total: items.length, pendientes: 0, enPreparacion: 0, porValidar: 0, aprobadas: 0, entregadas: 0, requierenAjuste: 0 };
  items.forEach(function(item) {
    if (item.estado === 'En preparación' || item.estado === 'Preparada') resumen.enPreparacion++;
    else if (item.estado === 'Pendiente de validación') resumen.porValidar++;
    else if (item.estado === 'Aprobada por Logística') resumen.aprobadas++;
    else if (item.estado === 'Entregada para ejecución') resumen.entregadas++;
    else if (item.estado === 'Requiere ajuste') resumen.requierenAjuste++;
    else resumen.pendientes++;
  });

  return { items: items, estados: ESTADOS_PALANCA_LOGISTICA.slice(), resumen: resumen };
}

function actualizarPalancaLogistica(token, temaId, datos) {
  const sesion = validarPermisoPalancasLogistica_(token);
  const entrada = datos || {};
  const id = String(temaId || '').trim();
  const estado = normalizarEstadoPalancaLogistica_(entrada.estado);
  if (!id) throw crearErrorAplicacion('TEMA_REQUERIDO', 'No se recibió el tema que se desea gestionar.');
  if (ESTADOS_PALANCA_LOGISTICA.indexOf(estado) < 0) throw crearErrorAplicacion('ESTADO_PALANCA_INVALIDO', 'El estado indicado para la palanca no es válido.');

  return ejecutarCrudConBloqueo(function() {
    const actual = leerRegistroPorIdSheet(HOJAS.TEMAS, id, opcionesCrudTemas(sesion.usuario));
    if (!actual || !convertirBooleano(actual.requierePalanca)) {
      throw crearErrorAplicacion('TEMA_SIN_PALANCA', 'El tema seleccionado no tiene una palanca configurada.');
    }

    const observaciones = String(entrada.observaciones || '').trim();
    if (estado === 'Requiere ajuste' && !observaciones) {
      throw crearErrorAplicacion('OBSERVACION_REQUERIDA', 'Debe registrar la razón por la cual la palanca requiere ajustes.');
    }

    const cambios = {
      palancaEstado: estado,
      palancaObservacionesLogistica: observaciones,
      palancaUltimaActualizacionLogistica: new Date()
    };

    if (estado === 'Aprobada por Logística') {
      cambios.palancaAprobadaLogisticaPor = sesion.nombre || sesion.usuario;
      cambios.palancaFechaAprobacionLogistica = new Date();
    } else if (estado !== 'Entregada para ejecución') {
      cambios.palancaAprobadaLogisticaPor = '';
      cambios.palancaFechaAprobacionLogistica = '';
    }

    if (estado === 'Entregada para ejecución') {
      if (!String(actual.palancaAprobadaLogisticaPor || '').trim() && String(actual.palancaEstado || '') !== 'Aprobada por Logística') {
        throw crearErrorAplicacion('PALANCA_NO_APROBADA', 'La palanca debe estar aprobada por Logística antes de entregarla para ejecución.');
      }
      cambios.palancaEntregadaEjecucionPor = sesion.nombre || sesion.usuario;
      cambios.palancaFechaEntregaEjecucion = new Date();
    } else {
      cambios.palancaEntregadaEjecucionPor = '';
      cambios.palancaFechaEntregaEjecucion = '';
    }

    const actualizado = actualizarRegistroSheet(HOJAS.TEMAS, id, cambios, opcionesCrudTemas(sesion.usuario));
    registrarAuditoria({
      usuario: sesion.usuario,
      nombre: sesion.nombre,
      accion: 'ACTUALIZAR_PALANCA_LOGISTICA',
      entidad: 'Temas',
      idRegistro: id,
      detalle: JSON.stringify({ estadoAnterior: actual.palancaEstado || '', estadoNuevo: estado, observaciones: observaciones })
    });
    registrarHistorialRecursoTema_({
      temaId: id,
      temaNombre: actual.nombre || '',
      tipoRecurso: 'PALANCA',
      estadoAnterior: actual.palancaEstado || 'Pendiente de información',
      estadoNuevo: estado,
      observaciones: observaciones,
      usuario: sesion.usuario || '',
      nombreUsuario: sesion.nombre || '',
      detalle: { cantidad: actual.palancaCantidad || '', destinatarios: actual.palancaDestinatarios || '' }
    });
    return convertirPalancaLogistica_(actualizado);
  });
}

function validarPermisoPalancasLogistica_(token) {
  try { return validarPermiso(token, PERMISO_GESTIONAR_PALANCAS_LOGISTICA); } catch (error) {}
  try { return validarPermiso(token, 'PALANCAS_APROBAR_LOGISTICA'); } catch (error2) {}
  return validarPermiso(token, 'TEMAS_GESTIONAR_PALANCAS');
}

function normalizarEstadoPalancaLogistica_(estado) {
  const valor = String(estado || '').trim();
  const equivalencias = {
    'Pendiente': 'Pendiente de información',
    'Entregada': 'En preparación',
    'Empaquetada': 'Preparada',
    'Entregada a Logística': 'Pendiente de validación'
  };
  return equivalencias[valor] || valor;
}

function convertirPalancaLogistica_(registro) {
  const estado = normalizarEstadoPalancaLogistica_(registro.palancaEstado || 'Pendiente de información');
  return {
    temaId: registro.id || '',
    temaNombre: registro.nombre || '',
    diaDelTema: registro.diaDelTema || '',
    horaPropuesta: formatearHoraTema_(registro.horaPropuesta),
    responsableId: registro.servidorId || '',
    responsableNombre: registro.servidorNombre || '',
    nombre: registro.palancaNombre || '',
    descripcion: registro.palancaDescripcion || '',
    momentoEntrega: registro.palancaMomentoEntrega || '',
    detalleMomento: registro.palancaDetalleMomento || '',
    formaEntrega: registro.palancaFormaEntrega || '',
    responsableEntrega: registro.palancaResponsableEntrega || '',
    detalleResponsable: registro.palancaDetalleResponsable || '',
    cantidad: registro.palancaCantidad || '',
    destinatarios: registro.palancaDestinatarios || '',
    requierePreparacion: convertirBooleano(registro.palancaRequierePreparacion),
    instrucciones: registro.palancaInstrucciones || '',
    observacionesResponsable: registro.palancaObservaciones || '',
    observacionesLogistica: registro.palancaObservacionesLogistica || '',
    estado: ESTADOS_PALANCA_LOGISTICA.indexOf(estado) >= 0 ? estado : 'Pendiente de información',
    aprobadaPor: registro.palancaAprobadaLogisticaPor || '',
    fechaAprobacion: registro.palancaFechaAprobacionLogistica || '',
    entregadaPor: registro.palancaEntregadaEjecucionPor || '',
    fechaEntrega: registro.palancaFechaEntregaEjecucion || '',
    fechaActualizacion: registro.palancaUltimaActualizacionLogistica || registro.fechaActualizacion || ''
  };
}
