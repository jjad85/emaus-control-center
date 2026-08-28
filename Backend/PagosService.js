/** Gestión integral de pagos del retiro para caminantes y servidores. */
const ESTADOS_REPORTE_PAGO = ['Pendiente', 'Aprobado', 'Rechazado'];
const TAMANO_MAXIMO_COMPROBANTE = 5 * 1024 * 1024;
const TIPOS_COMPROBANTE = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

function obtenerValorRetiroActual() {
  return obtenerValorRetiroPorTipo_('Caminante');
}

function obtenerValorRetiroPorTipo_(tipo) {
  const tipoPersona = normalizarTipoPersonaPago_(tipo);
  const claves = tipoPersona === 'Servidor'
    ? ['valor retiro servidor', 'valor_retiro_servidor']
    : ['valor retiro actual', 'valor_retiro_actual'];
  const configuraciones = leerHojaComoObjetos(HOJAS.CONFIGURACIONES);
  const item = configuraciones.find(function(x) {
    return claves.indexOf(normalizarTexto(x.clave)) >= 0 && convertirBooleano(x.activo);
  });
  const valor = Number(String(item && item.valor || '').replace(/[^0-9.-]/g, ''));
  if (!valor || valor <= 0) {
    const clave = tipoPersona === 'Servidor' ? 'VALOR_RETIRO_SERVIDOR' : 'VALOR_RETIRO_ACTUAL';
    throw crearErrorAplicacion('VALOR_RETIRO_NO_CONFIGURADO', 'Configure el parámetro ' + clave + ' con un valor mayor a cero.');
  }
  return valor;
}

function normalizarTipoPersonaPago_(tipo) {
  return normalizarTexto(tipo) === 'servidor' ? 'Servidor' : 'Caminante';
}

function obtenerDestinatarioRegistro(registro) {
  const esInvitador = ['invitador', 'otra persona'].includes(normalizarTexto(registro.tipoRegistrante));
  return esInvitador
    ? { nombre: registro.nombreRegistrante || registro.nombre || '', telefono: normalizarCelularColombia(registro.telefonoRegistrante) }
    : { nombre: registro.nombreCompleto || registro.nombre || '', telefono: normalizarCelularColombia(registro.celular || registro.telefono) };
}

function buscarCaminantePago(criterio) {
  return buscarPersonaPago('Caminante', criterio, '');
}

function buscarPersonaPago(tipo, criterio, personaId) {
  const tipoPersona = normalizarTipoPersonaPago_(tipo);
  const id = String(personaId || '').trim();
  const consulta = normalizarTexto(criterio);

  if (tipoPersona === 'Servidor') {
    const servidores = obtenerServidores({}).filter(function(x) { return x.activo !== false; });
    const coincidencias = servidores.filter(function(s) {
      if (id) return String(s.id) === id;
      return [
        s.numeroInscripcion,
        s.documentoIdentidad,
        s.nombre,
        s.nombreCompleto,
        s.correo,
        s.celular,
        s.telefono,
        s.id
      ].some(function(v) {
        return normalizarTexto(v).indexOf(consulta) >= 0;
      });
    });
    if (!id && !consulta) throw crearErrorAplicacion('CRITERIO_REQUERIDO', 'Ingrese el documento o número de inscripción del servidor.');
    if (!coincidencias.length) throw crearErrorAplicacion('SERVIDOR_NO_ENCONTRADO', 'No encontramos un servidor con ese criterio.');
    if (coincidencias.length > 1) throw crearErrorAplicacion('SERVIDOR_AMBIGUO', 'La búsqueda coincide con varios servidores. Ingrese un dato más específico.');
    return completarResumenPagosPersona_(coincidencias[0], 'Servidor');
  }

  if (!consulta && !id) {
    throw crearErrorAplicacion(
      'CRITERIO_REQUERIDO',
      'Ingrese el número de inscripción o el documento de la persona.'
    );
  }

  const aspirantes = leerHojaComoObjetos(HOJAS.ASPIRANTES);
  const caminantes = obtenerCaminantes({}).filter(function(x) {
    return convertirBooleano(x.activo);
  });

  /*
   * IMPORTANTE: ASPIRANTES y CAMINANTES tienen secuencias de ID independientes.
   * Un aspirante id=4 puede coexistir con un caminante id=4 que sea otra persona.
   *
   * Cuando viene criterio (numero de inscripcion/documento), ese dato identifica
   * a la persona y tiene prioridad sobre el ID interno. El ID solo se usa como
   * fallback cuando no existe criterio.
   */
  const caminante = caminantes.find(function(c) {
    const aspiranteRelacionado = aspirantes.find(function(a) {
      return (
        String(a.id) === String(c.aspiranteId) ||
        String(a.caminanteId) === String(c.id)
      );
    }) || {};

    if (consulta) {
      return [
        c.numeroInscripcion,
        c.documentoIdentidad,
        aspiranteRelacionado.numeroInscripcion,
        aspiranteRelacionado.documentoIdentidad
      ].some(function(v) {
        return normalizarTexto(v) === consulta;
      });
    }

    return Boolean(id) && String(c.id) === id;
  });

  if (caminante) {
    const resumenCaminante = completarResumenPagosPersona_(caminante, 'Caminante');
    resumenCaminante.estadoRegistro = 'Caminante';
    resumenCaminante.aspiranteId = caminante.aspiranteId || '';
    resumenCaminante.conversionAutomaticaPendiente = false;
    return resumenCaminante;
  }

  const aspirante = aspirantes.find(function(a) {
    const convertido = Boolean(String(a.caminanteId || '').trim()) ||
      normalizarTexto(a.estadoSolicitud) === 'convertido';

    if (convertido) return false;
    if (normalizarTexto(a.estadoSolicitud) === 'rechazado') return false;

    if (consulta) {
      return [
        a.numeroInscripcion,
        a.documentoIdentidad
      ].some(function(v) {
        return normalizarTexto(v) === consulta;
      });
    }

    return Boolean(id) && String(a.id) === id;
  });

  if (!aspirante) {
    throw crearErrorAplicacion(
      'PERSONA_PAGO_NO_ENCONTRADA',
      'No encontramos un aspirante o caminante con ese número de inscripción o documento.'
    );
  }

  return completarResumenPagoAspirante_(aspirante);
}

function completarResumenPagoAspirante_(aspirante) {
  const valorRetiro = obtenerValorRetiroPorTipo_('Caminante');

  return {
    id: aspirante.id,
    aspiranteId: aspirante.id,
    tipoPersona: 'Caminante',
    estadoRegistro: 'Aspirante',
    estadoSolicitud: aspirante.estadoSolicitud || 'Pendiente',
    conversionAutomaticaPendiente: true,
    nombre: aspirante.nombreCompleto || aspirante.nombre || '',
    numeroInscripcion: aspirante.numeroInscripcion || '',
    documentoIdentidad: aspirante.documentoIdentidad || '',
    correo: aspirante.correo || '',
    celular: aspirante.celular || aspirante.telefono || '',
    exentoPago: false,
    estadoPago: 'Pendiente',
    valorRetiro: valorRetiro,
    totalAprobado: 0,
    saldoPendiente: valorRetiro,
    excedente: 0,
    pagos: []
  };
}

function obtenerMiServidorPago(token) {
  const servidor = obtenerMiCuentaServidor(token);
  return completarResumenPagosPersona_(servidor, 'Servidor');
}

function completarResumenPagosCaminante(caminante) {
  return completarResumenPagosPersona_(caminante, 'Caminante');
}

function calcularEstadoPagoEstandar_(
  totalAprobado,
  valorRetiro,
  esExento
) {
  if (esExento) {
    return 'Exento';
  }

  const aprobado =
    Number(
      totalAprobado || 0
    );

  const esperado =
    Number(
      valorRetiro || 0
    );

  if (aprobado <= 0) {
    return 'Pendiente';
  }

  if (
    esperado > 0 &&
    aprobado < esperado
  ) {
    return 'Pago Parcial';
  }

  if (
    esperado > 0 &&
    aprobado > esperado
  ) {
    return 'Pago Excedido';
  }

  return 'Pago Total';
}


function completarResumenPagosPersona_(persona, tipo) {
  const tipoPersona = normalizarTipoPersonaPago_(tipo);
  const pagos = leerHojaComoObjetos(HOJAS.PAGOS).filter(function(p) {
    const tipoPago = normalizarTipoPersonaPago_(p.tipoPersona || (p.servidorId ? 'Servidor' : 'Caminante'));
    const idPago = tipoPago === 'Servidor' ? p.servidorId : p.caminanteId;
    return tipoPago === tipoPersona && String(idPago) === String(persona.id);
  });
  const aprobados = pagos.filter(function(p){ return normalizarTexto(p.estadoPagoReportado || p.estado) === 'aprobado'; });
  const pendientes = pagos.filter(function(p){ return normalizarTexto(p.estadoPagoReportado || p.estado) === 'pendiente'; });
  const rechazados = pagos.filter(function(p){ return normalizarTexto(p.estadoPagoReportado || p.estado) === 'rechazado'; });
  const totalAprobado = aprobados.reduce(function(s,p){ return s + Number(p.valorAprobado || p.valorReportado || 0); }, 0);
  const totalPendienteValidacion = pendientes.reduce(function(s,p){ return s + Number(p.valorReportado || 0); }, 0);
  const totalRechazado = rechazados.reduce(function(s,p){ return s + Number(p.valorReportado || 0); }, 0);
  const esExento = tipoPersona === 'Servidor' && Boolean(persona.exentoPago);
  const valorRetiroConfigurado = obtenerValorRetiroPorTipo_(tipoPersona);
  const valorRetiro = esExento ? 0 : valorRetiroConfigurado;
  return {
    id: persona.id,
    tipoPersona: tipoPersona,
    nombre: persona.nombreCompleto || persona.nombre,
    numeroInscripcion: persona.numeroInscripcion || '',
    documentoIdentidad: persona.documentoIdentidad || '',
    correo: persona.correo || '',
    celular: persona.celular || persona.telefono || '',
    exentoPago: esExento,
    motivoExencionPago: persona.motivoExencionPago || '',
    estadoPago:
      calcularEstadoPagoEstandar_(
        totalAprobado,
        valorRetiro,
        esExento
      ),
    valorRetiro: valorRetiro,
    totalAprobado: totalAprobado,
    totalPendienteValidacion: totalPendienteValidacion,
    totalRechazado: totalRechazado,
    cantidadPagos: pagos.length,
    cantidadAprobados: aprobados.length,
    cantidadPendientes: pendientes.length,
    cantidadRechazados: rechazados.length,
    saldoPendiente: Math.max(valorRetiro - totalAprobado, 0),
    excedente: Math.max(totalAprobado - valorRetiro, 0),
    pagos: pagos
      .map(function(p) { return normalizarPagoRespuesta(p, persona); })
      .sort(function(a, b) {
        return new Date(b.fechaPago || b.fechaRegistro || 0).getTime() -
          new Date(a.fechaPago || a.fechaRegistro || 0).getTime();
      })
  };
}

function normalizarPagoRespuesta(p, persona) {
  const registro = persona || {};
  const comprobanteId = String(p.comprobanteId || '').trim();
  const tipoPersona = normalizarTipoPersonaPago_(p.tipoPersona || (p.servidorId ? 'Servidor' : 'Caminante'));
  return {
    id: p.id,
    tipoPersona: tipoPersona,
    personaId: tipoPersona === 'Servidor' ? p.servidorId : p.caminanteId,
    caminanteId: p.caminanteId || '',
    servidorId: p.servidorId || '',
    personaNombre: registro.nombreCompleto || registro.nombre || '',
    caminanteNombre: tipoPersona === 'Caminante' ? (registro.nombreCompleto || registro.nombre || '') : '',
    numeroInscripcion: registro.numeroInscripcion || '',
    documentoIdentidad: registro.documentoIdentidad || '',
    correo: registro.correo || '',
    celular: registro.celular || registro.telefono || '',
    fechaPago: p.fechaPago,
    valorReportado: Number(p.valorReportado || 0),
    valorAprobado: p.valorAprobado === '' ? null : Number(p.valorAprobado || 0),
    medioPago: p.medioPago,
    entidadPago: p.entidadPago,
    referenciaPago: p.referenciaPago,
    nombrePagador: p.nombrePagador,
    telefonoPagador: p.telefonoPagador,
    estado: p.estadoPagoReportado || p.estado,
    observacionesReportante: p.observacionesReportante,
    observacionesTesoreria: p.observacionesTesoreria,
    motivoModificacionValor: p.motivoModificacionValor,
    superaSaldo: p.superaSaldo,
    excedente: Number(p.excedente || 0),
    comprobanteId: comprobanteId,
    comprobanteUrl: p.comprobanteUrl,
    comprobanteDescargaUrl: comprobanteId
      ? 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(comprobanteId)
      : p.comprobanteUrl,
    comprobanteNombre: p.comprobanteNombre,
    comprobanteTipo: p.comprobanteTipo,
    comprobanteTamano: Number(p.comprobanteTamano || 0),
    fechaRegistro: p.fechaRegistro,
    fechaActualizacion: p.fechaActualizacion,
    fechaValidacion: p.fechaValidacion,
    validadoPor: p.validadoPor,
    actualizadoPor: p.actualizadoPor || '',
    origenReporte: p.actualizadoPor || 'PORTAL_PAGOS',

    fechaReversion: p.fechaReversion || '',
    revertidoPor: p.revertidoPor || '',
    motivoReversion: p.motivoReversion || '',
    estadoAnteriorReversion: p.estadoAnteriorReversion || '',
    valorAprobadoAnterior: p.valorAprobadoAnterior || '',
    validadoPorAnterior: p.validadoPorAnterior || '',
    fechaValidacionAnterior: p.fechaValidacionAnterior || ''
  };
}

function guardarComprobantePago(archivo, persona) {
  if (!archivo || !archivo.base64 || !archivo.nombre || !archivo.tipo) {
    return { id:'', url:'', nombre:'', tipo:'', tamano:0 };
  }
  if (!TIPOS_COMPROBANTE.includes(String(archivo.tipo).toLowerCase())) throw crearErrorAplicacion('TIPO_COMPROBANTE_INVALIDO', 'Solo se permiten PDF, JPG, JPEG y PNG.');
  const bytes = Utilities.base64Decode(String(archivo.base64).replace(/^data:[^;]+;base64,/, ''));
  if (bytes.length > TAMANO_MAXIMO_COMPROBANTE) throw crearErrorAplicacion('COMPROBANTE_MUY_GRANDE', 'El comprobante no puede superar 5 MB.');
  const props = PropertiesService.getScriptProperties();
  const carpetaId = props.getProperty('CARPETA_COMPROBANTES_PAGOS_ID');
  if (!carpetaId) throw crearErrorAplicacion('CARPETA_PAGOS_NO_CONFIGURADA', 'Ejecute instalarModuloPagos antes de recibir pagos.');
  const carpeta = DriveApp.getFolderById(carpetaId);
  const extension = (String(archivo.nombre).match(/\.([^.]+)$/) || [,'bin'])[1].toLowerCase();
  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  const codigo = String(persona.numeroInscripcion || persona.id || 'SINCODIGO').replace(/[^A-Za-z0-9-]/g,'');
  const documento = String(persona.documentoIdentidad || persona.celular || 'SINDOC').replace(/[^0-9A-Za-z]/g,'');
  const valor = String(persona.valorReportado || '').replace(/[^0-9]/g,'');
  const nombre = normalizarTipoPersonaPago_(persona.tipoPersona).toUpperCase() + '_' + codigo + '_' + documento + '_' + fecha + '_' + valor + '.' + extension;
  const blob = Utilities.newBlob(bytes, archivo.tipo, nombre);
  const file = carpeta.createFile(blob);
  return { id:file.getId(), url:file.getUrl(), nombre:nombre, tipo:archivo.tipo, tamano:bytes.length };
}

function reportarPagoPublico(datos) {
  const entrada = datos || {};

  const medioPago = String(entrada.medioPago || 'Transferencia').trim();

  if (!['Transferencia', 'Efectivo'].includes(medioPago)) {
    throw crearErrorAplicacion(
      'MEDIO_PAGO_INVALIDO',
      'El método de pago debe ser Transferencia o Efectivo.'
    );
  }

  if (
    medioPago === 'Transferencia' &&
    (!entrada.archivo || !entrada.archivo.base64)
  ) {
    throw crearErrorAplicacion(
      'COMPROBANTE_REQUERIDO',
      'Debe adjuntar el comprobante cuando el método de pago sea transferencia.'
    );
  }

  let receptorEfectivo = null;

  if (medioPago === 'Efectivo') {
    const receptorServidorId =
      String(entrada.receptorServidorId || '').trim();

    if (!receptorServidorId) {
      throw crearErrorAplicacion(
        'SERVIDOR_RECEPTOR_REQUERIDO',
        'Debes seleccionar de la lista el servidor que recibió el dinero.'
      );
    }

    receptorEfectivo =
      obtenerServidorReceptorEfectivo_(receptorServidorId);
  }

  const tipoPersona = normalizarTipoPersonaPago_(entrada.tipoPersona);
  let resumen = buscarPersonaPago(
    tipoPersona,
    entrada.criterio,
    entrada.personaId
  );

  if (tipoPersona === 'Servidor' && resumen.exentoPago) {
    throw crearErrorAplicacion(
      'SERVIDOR_EXENTO_PAGO',
      'Este servidor está marcado como exento de pago y no tiene saldo pendiente.'
    );
  }

  const valor = Number(entrada.valorReportado);

  if (!valor || valor <= 0) {
    throw crearErrorAplicacion(
      'VALOR_PAGO_INVALIDO',
      'Ingrese un valor de pago mayor a cero.'
    );
  }

  resumen.valorReportado = valor;
  const comprobante = medioPago === 'Transferencia'
    ? guardarComprobantePago(entrada.archivo, resumen)
    : { id:'', url:'', nombre:'', tipo:'', tamano:0 };

  return ejecutarCrudConBloqueo(function() {
    let conversionAutomatica = false;
    let aspiranteId = '';
    let caminanteId = tipoPersona === 'Caminante' ? resumen.id : '';

    /*
     * Para participantes, el portal acepta tanto aspirantes como caminantes.
     * Si la persona todavía es aspirante, se convierte automáticamente antes
     * de crear el pago. La conversión manual existente se conserva intacta.
     */
    if (
      tipoPersona === 'Caminante' &&
      resumen.estadoRegistro === 'Aspirante'
    ) {
      aspiranteId = String(resumen.aspiranteId || resumen.id || '').trim();
      const aspiranteActual = obtenerAspirantePorId(aspiranteId);

      if (String(aspiranteActual.caminanteId || '').trim()) {
        caminanteId = String(aspiranteActual.caminanteId).trim();
      } else {
        const sesionSistema = {
          usuario: 'PORTAL_PAGOS',
          nombre: 'Portal público de pagos'
        };

        const conversion = convertirAspiranteEnCaminanteInterno(
          sesionSistema,
          aspiranteId,
          'Conversión automática por recepción de reporte de pago.'
        );

        caminanteId = String(conversion.caminante.id || '').trim();
        conversionAutomatica = true;
      }

      const caminanteConvertido = leerRegistroPorIdSheet(
        HOJAS.CAMINANTES,
        caminanteId,
        { usuario: 'PORTAL_PAGOS' }
      );

      // Defensa contra asociaciones cruzadas: la conversión debe conservar
      // exactamente la inscripción del aspirante seleccionado.
      if (
        normalizarTexto(caminanteConvertido.numeroInscripcion) !==
        normalizarTexto(aspiranteActual.numeroInscripcion)
      ) {
        throw crearErrorAplicacion(
          'IDENTIDAD_PAGO_INCONSISTENTE',
          'No fue posible asociar el pago de forma segura con la persona seleccionada. No se registró el pago.'
        );
      }

      resumen = completarResumenPagosPersona_(
        caminanteConvertido,
        'Caminante'
      );
      resumen.valorReportado = valor;
    }

    const registro = {
      tipoPersona: tipoPersona,
      caminanteId: tipoPersona === 'Caminante' ? caminanteId : '',
      servidorId: tipoPersona === 'Servidor' ? resumen.id : '',
      retiroId: 'RETIRO_ACTUAL',
      valorReportado: valor,
      valorAprobado: '',
      fechaPago: String(entrada.fechaPago || ''),
      medioPago: medioPago,
      entidadPago: String(entrada.entidadPago || ''),
      referenciaPago: String(entrada.referenciaPago || ''),
      nombrePagador:
        medioPago === 'Efectivo'
          ? receptorEfectivo.nombre
          : String(entrada.nombrePagador || ''),
      telefonoPagador:
        medioPago === 'Efectivo'
          ? receptorEfectivo.celular
          : validarCelularColombia(
              entrada.telefonoPagador,
              {
                etiqueta:
                  'El teléfono del pagador'
              }
            ),
      comprobanteUrl: comprobante.url,
      comprobanteId: comprobante.id,
      comprobanteNombre: comprobante.nombre,
      comprobanteTipo: comprobante.tipo,
      comprobanteTamano: comprobante.tamano,
      estadoPagoReportado: 'Pendiente',
      observacionesReportante: String(entrada.observaciones || ''),
      observacionesTesoreria: '',
      validadoPor: '',
      fechaValidacion: '',
      motivoModificacionValor: '',
      superaSaldo: valor > resumen.saldoPendiente ? 'Sí' : 'No',
      excedente: Math.max(valor - resumen.saldoPendiente, 0),
      activo: 'Sí',
      fechaRegistro: new Date(),
      fechaActualizacion: new Date(),
      actualizadoPor: 'PORTAL_PAGOS'
    };

    const creado = crearRegistroSheet(
      HOJAS.PAGOS,
      registro,
      { usuario: 'PORTAL_PAGOS' }
    );

    if (tipoPersona === 'Caminante') {
      recalcularEstadoPagoCaminante(caminanteId, 'PORTAL_PAGOS');
    }

    registrarAuditoria({
      usuario: 'PORTAL_PAGOS',
      nombre: resumen.nombre || '',
      accion: conversionAutomatica
        ? 'REPORTAR_PAGO_Y_CONVERTIR_ASPIRANTE'
        : 'REPORTAR_PAGO_PUBLICO',
      entidad: 'Pagos',
      idRegistro: creado.id,
      detalle: JSON.stringify({
        tipoPersona: tipoPersona,
        aspiranteId: aspiranteId,
        caminanteId: caminanteId,
        valorReportado: valor,
        estadoPago: 'Pendiente',
        conversionAutomatica: conversionAutomatica
      })
    });

    return {
      id: creado.id,
      estado: 'Pendiente',
      tipoPersona: tipoPersona,
      aspiranteId: aspiranteId,
      caminanteId: caminanteId,
      conversionAutomatica: conversionAutomatica,
      superaSaldo: registro.superaSaldo,
      excedente: registro.excedente
    };
  });
}

function obtenerPagos(token, filtros) {
  validarPermiso(token, 'PAGOS_VER_ESTADOS_CUENTA');
  const f = filtros || {};
  const caminantesPorId = {};
  const servidoresPorId = {};
  leerHojaComoObjetos(HOJAS.CAMINANTES).forEach(function(x) { caminantesPorId[String(x.id)] = x; });
  leerHojaComoObjetos(HOJAS.SERVIDORES).forEach(function(x) { servidoresPorId[String(x.id)] = convertirServidor(x); });

  return leerHojaComoObjetos(HOJAS.PAGOS)
    .filter(function(p) {
      const tipoPersona = normalizarTipoPersonaPago_(p.tipoPersona || (p.servidorId ? 'Servidor' : 'Caminante'));
      return (!f.estado || normalizarTexto(p.estadoPagoReportado) === normalizarTexto(f.estado)) &&
        (!f.tipoPersona || tipoPersona === normalizarTipoPersonaPago_(f.tipoPersona)) &&
        (!f.caminanteId || String(p.caminanteId) === String(f.caminanteId)) &&
        (!f.servidorId || String(p.servidorId) === String(f.servidorId)) &&
        pagoEstaEnRangoFechas_(p, f.fechaDesde, f.fechaHasta);
    })
    .map(function(pago) {
      const tipoPersona = normalizarTipoPersonaPago_(pago.tipoPersona || (pago.servidorId ? 'Servidor' : 'Caminante'));
      const persona = tipoPersona === 'Servidor'
        ? servidoresPorId[String(pago.servidorId)] || {}
        : caminantesPorId[String(pago.caminanteId)] || {};
      return normalizarPagoRespuesta(pago, persona);
    });
}

function editarValorPagoPendiente(token, id, valorReportado, motivo) {
  const sesion = validarPermiso(token, 'PAGOS_VALIDAR_COMPROBANTE');
  const pago = leerRegistroPorIdSheet(HOJAS.PAGOS, id, { usuario: sesion.usuario });

  if (normalizarTexto(pago.estadoPagoReportado || pago.estado || '') !== 'pendiente') {
    throw crearErrorAplicacion('PAGO_NO_EDITABLE', 'Solo se puede corregir el valor de un pago que esté pendiente.');
  }

  const valorAnterior = Number(pago.valorReportado || 0);
  const valorNuevo = Number(valorReportado);
  const motivoTexto = String(motivo || '').trim();

  if (!valorNuevo || valorNuevo <= 0) {
    throw crearErrorAplicacion('VALOR_PAGO_INVALIDO', 'El valor reportado debe ser mayor a cero.');
  }
  if (valorNuevo === valorAnterior) {
    throw crearErrorAplicacion('VALOR_SIN_CAMBIOS', 'El nuevo valor es igual al valor actualmente reportado.');
  }
  if (!motivoTexto) {
    throw crearErrorAplicacion('MOTIVO_CORRECCION_REQUERIDO', 'Debes indicar el motivo de la corrección.');
  }

  const actualizado = actualizarRegistroSheet(
    HOJAS.PAGOS, id,
    {
      valorReportado: valorNuevo,
      motivoModificacionValor: motivoTexto,
      fechaActualizacion: new Date(),
      actualizadoPor: sesion.usuario
    },
    { usuario: sesion.usuario }
  );

  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre || '',
    accion: 'CORREGIR_VALOR_PAGO_PENDIENTE',
    entidad: 'Pagos',
    idRegistro: id,
    detalle: JSON.stringify({
      valorAnterior: valorAnterior,
      valorNuevo: valorNuevo,
      motivo: motivoTexto
    })
  });

  return normalizarPagoRespuesta(actualizado);
}

function normalizarValorPago_(valor) {
  if (typeof valor === 'number') {
    return isFinite(valor) ? valor : 0;
  }

  const texto = String(valor || '').trim();
  if (!texto) return 0;

  // En este sistema los pagos se manejan en pesos enteros.
  // Esto evita interpretar "380.000" como 380 al usar Number().
  const soloDigitos = texto.replace(/\D/g, '');

  return Number(soloDigitos || 0);
}

function validarPago(token, id, decision) {
  const sesion=validarPermiso(token,'PAGOS_VALIDAR_COMPROBANTE');
  const pago=leerRegistroPorIdSheet(HOJAS.PAGOS,id,{usuario:sesion.usuario});
  const estado =
    normalizarTexto(decision.estado) === 'aprobado'
      ? 'Aprobado'
      : 'Rechazado';

  const valorReportadoNormalizado =
    normalizarValorPago_(
      pago.valorReportado
    );

  const valorAprobado =
    estado === 'Aprobado'
      ? normalizarValorPago_(
          decision.valorAprobado ||
          pago.valorReportado
        )
      : '';

  const huboCorreccionValor =
    estado === 'Aprobado' &&
    valorReportadoNormalizado !==
      valorAprobado;

  if (
    estado === 'Aprobado' &&
    (!valorAprobado || valorAprobado <= 0)
  ) {
    throw crearErrorAplicacion(
      'VALOR_APROBADO_INVALIDO',
      'El valor aprobado debe ser mayor a cero.'
    );
  }

  if (
    huboCorreccionValor &&
    !String(
      decision.motivoModificacionValor ||
      ''
    ).trim()
  ) {
    throw crearErrorAplicacion(
      'MOTIVO_REQUERIDO',
      'Indique el motivo de la corrección del valor.'
    );
  }
  if (estado==='Rechazado' && !String(decision.observacionesTesoreria||'').trim()) throw crearErrorAplicacion('MOTIVO_RECHAZO_REQUERIDO','Indique el motivo del rechazo.');
  const actualizado = actualizarRegistroSheet(
    HOJAS.PAGOS,
    id,
    {
      estadoPagoReportado: estado,
      valorAprobado: valorAprobado,
      observacionesTesoreria:
        String(
          decision.observacionesTesoreria ||
          ''
        ),
      motivoModificacionValor:
        huboCorreccionValor
          ? String(
              decision.motivoModificacionValor ||
              ''
            )
          : '',
      validadoPor: sesion.usuario,
      fechaValidacion: new Date(),
      fechaActualizacion: new Date(),
      actualizadoPor: sesion.usuario
    },
    { usuario: sesion.usuario }
  );
  const tipoPersona = normalizarTipoPersonaPago_(pago.tipoPersona || (pago.servidorId ? 'Servidor' : 'Caminante'));
  if (estado === 'Rechazado' && tipoPersona === 'Caminante') {
    const caminante = leerRegistroPorIdSheet(HOJAS.CAMINANTES, pago.caminanteId, {usuario:sesion.usuario});
    const destino = obtenerDestinatarioRegistro(caminante);
    crearNotificacionWhatsappPendiente({ tipo:TIPOS_NOTIFICACION_WHATSAPP.PAGO_RECHAZADO, entidad:'Pagos', entidadId:id, nombre:destino.nombre, telefono:destino.telefono, motivo:String(decision.observacionesTesoreria||'') });
  }
  if (tipoPersona === 'Servidor') recalcularEstadoPagoServidor_(pago.servidorId, sesion.usuario);
  else recalcularEstadoPagoCaminante(pago.caminanteId,sesion.usuario);
  return normalizarPagoRespuesta(actualizado);
}

function revertirAprobacionPago(token, id, motivo) {
  const sesion = validarPermiso(token, 'PAGOS_VALIDAR_COMPROBANTE');
  const pago = leerRegistroPorIdSheet(
    HOJAS.PAGOS,
    id,
    { usuario: sesion.usuario }
  );

  if (!pago) {
    throw crearErrorAplicacion(
      'PAGO_NO_ENCONTRADO',
      'No encontramos el pago solicitado.'
    );
  }

  const estadoActual = String(
    pago.estadoPagoReportado || ''
  ).trim();

  if (normalizarTexto(estadoActual) !== 'aprobado') {
    throw crearErrorAplicacion(
      'PAGO_NO_APROBADO',
      'Solo se puede revertir un pago que actualmente esté aprobado.'
    );
  }

  const motivoTexto = String(motivo || '').trim();

  if (!motivoTexto) {
    throw crearErrorAplicacion(
      'MOTIVO_REVERSION_REQUERIDO',
      'Debes indicar el motivo por el cual se revierte la aprobación.'
    );
  }

  const ahora = new Date();

  const actualizado = actualizarRegistroSheet(
    HOJAS.PAGOS,
    id,
    {
      estadoAnteriorReversion: estadoActual,
      valorAprobadoAnterior: pago.valorAprobado || pago.valorReportado || '',
      validadoPorAnterior: pago.validadoPor || '',
      fechaValidacionAnterior: pago.fechaValidacion || '',

      estadoPagoReportado: 'Pendiente',
      valorAprobado: '',
      validadoPor: '',
      fechaValidacion: '',

      fechaReversion: ahora,
      revertidoPor: sesion.usuario,
      motivoReversion: motivoTexto,

      fechaActualizacion: ahora,
      actualizadoPor: sesion.usuario
    },
    { usuario: sesion.usuario }
  );

  const tipoPersona = normalizarTipoPersonaPago_(
    pago.tipoPersona ||
    (pago.servidorId ? 'Servidor' : 'Caminante')
  );

  if (tipoPersona === 'Servidor') {
    recalcularEstadoPagoServidor_(
      pago.servidorId,
      sesion.usuario
    );
  } else {
    recalcularEstadoPagoCaminante(
      pago.caminanteId,
      sesion.usuario
    );
  }

  return normalizarPagoRespuesta(actualizado);
}

function recalcularEstadoPagoCaminante(caminanteId, usuario) {
  const caminante=leerRegistroPorIdSheet(HOJAS.CAMINANTES,caminanteId,{usuario:usuario});
  const resumen=completarResumenPagosPersona_(caminante, 'Caminante');
  actualizarRegistroSheet(HOJAS.CAMINANTES,caminanteId,{estadoPago:resumen.estadoPago,totalAbonado:resumen.totalAprobado,saldoPendiente:resumen.saldoPendiente,excedentePago:resumen.excedente,fechaActualizacion:new Date(),actualizadoPor:usuario},{usuario:usuario});
  return resumen;
}

function recalcularEstadoPagoServidor_(servidorId, usuario) {
  const servidor = obtenerServidorPorId(servidorId);
  const resumen = completarResumenPagosPersona_(servidor, 'Servidor');
  actualizarRegistroSheet(HOJAS.SERVIDORES, servidorId, {estadoPago:resumen.estadoPago,totalAbonado:resumen.totalAprobado,saldoPendiente:resumen.saldoPendiente,excedentePago:resumen.excedente,fechaActualizacion:new Date(),actualizadoPor:usuario},{usuario:usuario});
  return resumen;
}

function obtenerPagosCaminante(token,caminanteId){ validarPermiso(token,'CAMINANTES_VER_DETALLE'); return completarResumenPagosPersona_(leerRegistroPorIdSheet(HOJAS.CAMINANTES,caminanteId,{usuario:'CONSULTA'}), 'Caminante'); }

function formatearMonedaRecordatorioPago_(
  valor
) {
  return '$ ' +
    Number(
      valor || 0
    ).toLocaleString(
      'es-CO'
    );
}

function crearRecordatorioPagoWhatsapp(
  token,
  tipo,
  personaId
) {
  const sesion =
    validarPermiso(
      token,
      'PAGOS_RECORDAR_PAGO'
    );

  const tipoPersona =
    normalizarTipoPersonaPago_(
      tipo
    );

  const persona =
    tipoPersona === 'Servidor'
      ? obtenerServidorPorId(
          personaId
        )
      : leerRegistroPorIdSheet(
          HOJAS.CAMINANTES,
          personaId,
          {
            usuario:
              sesion.usuario
          }
        );

  if (!persona) {
    throw crearErrorAplicacion(
      'PERSONA_PAGO_NO_ENCONTRADA',
      'No encontramos la persona solicitada.'
    );
  }

  const resumen =
    completarResumenPagosPersona_(
      persona,
      tipoPersona
    );

  if (resumen.exentoPago) {
    throw crearErrorAplicacion(
      'PERSONA_EXENTA_PAGO',
      'La persona está exenta de pago y no requiere recordatorio.'
    );
  }

  if (
    Number(
      resumen.saldoPendiente || 0
    ) <= 0
  ) {
    throw crearErrorAplicacion(
      'PAGO_SIN_SALDO_PENDIENTE',
      'La persona ya no tiene saldo pendiente.'
    );
  }

  const telefono =
    String(
      resumen.celular || ''
    ).trim();

  if (!telefono) {
    throw crearErrorAplicacion(
      'CELULAR_RECORDATORIO_REQUERIDO',
      'La persona no tiene un celular registrado para enviar el recordatorio.'
    );
  }

  const notificacion =
    crearNotificacionWhatsappRecordatorioPago({
      entidad:
        tipoPersona === 'Servidor'
          ? 'Servidores'
          : 'Caminantes',
      entidadId:
        resumen.id,
      nombre:
        resumen.nombre || '',
      telefono:
        telefono,
      detalle: {
        saldoPendiente:
          formatearMonedaRecordatorioPago_(
            resumen.saldoPendiente
          ),
        valorRetiro:
          formatearMonedaRecordatorioPago_(
            resumen.valorRetiro
          ),
        totalAprobado:
          formatearMonedaRecordatorioPago_(
            resumen.totalAprobado
          ),
        tipoPersona:
          tipoPersona,
        numeroInscripcion:
          resumen.numeroInscripcion || ''
      }
    });

  registrarAuditoria({
    usuario:
      sesion.usuario,
    nombre:
      sesion.nombre || '',
    accion:
      'CREAR_RECORDATORIO_PAGO_WHATSAPP',
    entidad:
      tipoPersona,
    idRegistro:
      resumen.id,
    detalle:
      JSON.stringify({
        saldoPendiente:
          resumen.saldoPendiente,
        numeroInscripcion:
          resumen.numeroInscripcion || ''
      })
  });

  return {
    id:
      notificacion.id,
    tipo:
      notificacion.tipo,
    estado:
      notificacion.estado
  };
}


function obtenerEstadoCuentaPersona(token, tipo, personaId) {
  const tipoPersona = normalizarTipoPersonaPago_(tipo);
  if (tipoPersona === 'Servidor') {
    validarPermiso(token, 'SERVIDORES_VER_DETALLE');
    const servidor = obtenerServidorPorId(personaId);
    if (!servidor) throw crearErrorAplicacion('SERVIDOR_NO_ENCONTRADO','No encontramos el servidor solicitado.');
    return completarResumenPagosPersona_(servidor, 'Servidor');
  }
  validarPermiso(token, 'CAMINANTES_VER_DETALLE');
  return completarResumenPagosPersona_(
    leerRegistroPorIdSheet(HOJAS.CAMINANTES, personaId, {usuario:'CONSULTA_ESTADO_CUENTA'}),
    'Caminante'
  );
}


function convertirFechaPago_(valor, finDelDia) {
  if (!valor) return null;
  if (valor instanceof Date && !isNaN(valor.getTime())) return new Date(valor.getTime());
  const texto = String(valor).trim();
  if (!texto) return null;
  const soloFecha = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let fecha;
  if (soloFecha) {
    fecha = new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
  } else {
    fecha = new Date(texto);
  }
  if (isNaN(fecha.getTime())) return null;
  if (finDelDia) fecha.setHours(23, 59, 59, 999);
  else fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function obtenerFechaComparablePago_(pago) {
  const fecha = pago.fechaPago || pago.fechaRegistro;
  if (fecha instanceof Date && !isNaN(fecha.getTime())) return fecha;
  const convertida = new Date(fecha);
  return isNaN(convertida.getTime()) ? null : convertida;
}

function pagoEstaEnRangoFechas_(pago, fechaDesde, fechaHasta) {
  if (!fechaDesde && !fechaHasta) return true;
  const fechaPago = obtenerFechaComparablePago_(pago);
  if (!fechaPago) return false;
  const desde = convertirFechaPago_(fechaDesde, false);
  const hasta = convertirFechaPago_(fechaHasta, true);
  return (!desde || fechaPago >= desde) && (!hasta || fechaPago <= hasta);
}

function obtenerReportePagos(token, filtros) {
  validarPermiso(token, 'PAGOS_VER_ESTADOS_CUENTA');
  const f = filtros || {};
  const grupos = [
    construirGrupoReportePagos_('Caminante', f),
    construirGrupoReportePagos_('Servidor', f)
  ];
  const total = grupos.reduce(function(acumulado, grupo) {
    acumulado.cantidadPersonas += grupo.cantidadPersonas;
    acumulado.valorEsperado += grupo.valorEsperado;
    acumulado.valorRecaudado += grupo.valorRecaudado;
    acumulado.valorPendiente += grupo.valorPendiente;
    acumulado.excedente += grupo.excedente;
    return acumulado;
  }, { cantidadPersonas: 0, valorEsperado: 0, valorRecaudado: 0, valorPendiente: 0, excedente: 0 });
  return {
    filtros: { fechaDesde: String(f.fechaDesde || ''), fechaHasta: String(f.fechaHasta || '') },
    grupos: grupos,
    total: total,
    generadoEn: new Date()
  };
}

function construirGrupoReportePagos_(tipo, filtros) {
  const tipoPersona = normalizarTipoPersonaPago_(tipo);
  const personas = tipoPersona === 'Servidor'
    ? leerHojaComoObjetos(HOJAS.SERVIDORES).map(function(x) { return convertirServidor(x); }).filter(function(x) { return x.activo !== false; })
    : leerHojaComoObjetos(HOJAS.CAMINANTES).filter(function(x) { return convertirBooleano(x.activo); });
  const valorIndividual = obtenerValorRetiroPorTipo_(tipoPersona);
  const pagosAprobados = leerHojaComoObjetos(HOJAS.PAGOS).filter(function(p) {
    const tipoPago = normalizarTipoPersonaPago_(p.tipoPersona || (p.servidorId ? 'Servidor' : 'Caminante'));
    return tipoPago === tipoPersona &&
      normalizarTexto(p.estadoPagoReportado || p.estado) === 'aprobado' &&
      pagoEstaEnRangoFechas_(p, filtros.fechaDesde, filtros.fechaHasta);
  });
  const recaudadoPorPersona = {};
  pagosAprobados.forEach(function(p) {
    const id = String(tipoPersona === 'Servidor' ? p.servidorId : p.caminanteId);
    recaudadoPorPersona[id] = (recaudadoPorPersona[id] || 0) + Number(p.valorAprobado || p.valorReportado || 0);
  });
  const detalle = personas.map(function(persona) {
    const recaudado = Number(recaudadoPorPersona[String(persona.id)] || 0);
    const esExento = tipoPersona === 'Servidor' && Boolean(persona.exentoPago);
    const esperadoPersona = esExento ? 0 : valorIndividual;
    return {
      id: persona.id,
      nombre: persona.nombreCompleto || persona.nombre || '',
      numeroInscripcion: persona.numeroInscripcion || '',
      documentoIdentidad: persona.documentoIdentidad || '',
      exentoPago: esExento,
      motivoExencionPago: persona.motivoExencionPago || '',
      valorEsperado: esperadoPersona,
      valorRecaudado: recaudado,
      valorPendiente: Math.max(esperadoPersona - recaudado, 0),
      excedente: Math.max(recaudado - esperadoPersona, 0),
      estadoPago:
        calcularEstadoPagoEstandar_(
          recaudado,
          esperadoPersona,
          esExento
        )
    };
  });
  const valorRecaudado = detalle.reduce(function(suma, item) { return suma + item.valorRecaudado; }, 0);
  const valorEsperado = detalle.reduce(function(suma, item) { return suma + item.valorEsperado; }, 0);
  return {
    tipoPersona: tipoPersona,
    cantidadPersonas: personas.length,
    cantidadExentos: detalle.filter(function(item) { return item.exentoPago; }).length,
    valorIndividual: valorIndividual,
    valorEsperado: valorEsperado,
    valorRecaudado: valorRecaudado,
    valorPendiente: Math.max(valorEsperado - valorRecaudado, 0),
    excedente: Math.max(valorRecaudado - valorEsperado, 0),
    detalle: detalle
  };
}
