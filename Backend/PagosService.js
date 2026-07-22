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
      return [s.nombre, s.correo, s.celular, s.id].some(function(v) {
        return normalizarTexto(v).indexOf(consulta) >= 0;
      });
    });
    if (!id && !consulta) throw crearErrorAplicacion('CRITERIO_REQUERIDO', 'Ingrese el nombre, correo o celular del servidor.');
    if (!coincidencias.length) throw crearErrorAplicacion('SERVIDOR_NO_ENCONTRADO', 'No encontramos un servidor con ese criterio.');
    if (coincidencias.length > 1) throw crearErrorAplicacion('SERVIDOR_AMBIGUO', 'La búsqueda coincide con varios servidores. Ingrese un dato más específico.');
    return completarResumenPagosPersona_(coincidencias[0], 'Servidor');
  }

  if (!consulta && !id) throw crearErrorAplicacion('CRITERIO_REQUERIDO', 'Ingrese el código de inscripción o el documento del caminante.');
  const caminantes = obtenerCaminantes({}).filter(function(x){ return convertirBooleano(x.activo); });
  const aspirantes = leerHojaComoObjetos(HOJAS.ASPIRANTES);
  const caminante = caminantes.find(function(c) {
    if (id) return String(c.id) === id;
    const aspirante = aspirantes.find(function(a){ return String(a.id) === String(c.aspiranteId) || String(a.caminanteId) === String(c.id); }) || {};
    return [c.numeroInscripcion, c.documentoIdentidad, aspirante.numeroInscripcion, aspirante.documentoIdentidad]
      .some(function(v){ return normalizarTexto(v) === consulta; });
  });
  if (!caminante) throw crearErrorAplicacion('CAMINANTE_NO_ENCONTRADO', 'No encontramos un caminante con ese código o documento.');
  return completarResumenPagosPersona_(caminante, 'Caminante');
}

function obtenerMiServidorPago(token) {
  const servidor = obtenerMiCuentaServidor(token);
  return completarResumenPagosPersona_(servidor, 'Servidor');
}

function completarResumenPagosCaminante(caminante) {
  return completarResumenPagosPersona_(caminante, 'Caminante');
}

function completarResumenPagosPersona_(persona, tipo) {
  const tipoPersona = normalizarTipoPersonaPago_(tipo);
  const pagos = leerHojaComoObjetos(HOJAS.PAGOS).filter(function(p) {
    const tipoPago = normalizarTipoPersonaPago_(p.tipoPersona || (p.servidorId ? 'Servidor' : 'Caminante'));
    const idPago = tipoPago === 'Servidor' ? p.servidorId : p.caminanteId;
    return tipoPago === tipoPersona && String(idPago) === String(persona.id);
  });
  const aprobados = pagos.filter(function(p){ return normalizarTexto(p.estadoPagoReportado || p.estado) === 'aprobado'; });
  const totalAprobado = aprobados.reduce(function(s,p){ return s + Number(p.valorAprobado || p.valorReportado || 0); }, 0);
  const valorRetiro = obtenerValorRetiroPorTipo_(tipoPersona);
  return {
    id: persona.id,
    tipoPersona: tipoPersona,
    nombre: persona.nombreCompleto || persona.nombre,
    numeroInscripcion: persona.numeroInscripcion || '',
    documentoIdentidad: persona.documentoIdentidad || '',
    correo: persona.correo || '',
    celular: persona.celular || persona.telefono || '',
    estadoPago: totalAprobado <= 0 ? 'Pendiente' : totalAprobado < valorRetiro ? 'Pago Parcial' : 'Pago Total',
    valorRetiro: valorRetiro,
    totalAprobado: totalAprobado,
    saldoPendiente: Math.max(valorRetiro - totalAprobado, 0),
    excedente: Math.max(totalAprobado - valorRetiro, 0),
    pagos: pagos.map(function(p) { return normalizarPagoRespuesta(p, persona); })
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
    fechaValidacion: p.fechaValidacion,
    validadoPor: p.validadoPor
  };
}

function guardarComprobantePago(archivo, persona) {
  if (!archivo || !archivo.base64 || !archivo.nombre || !archivo.tipo) throw crearErrorAplicacion('COMPROBANTE_REQUERIDO', 'Adjunte el comprobante de pago.');
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
  const tipoPersona = normalizarTipoPersonaPago_(entrada.tipoPersona);
  const resumen = buscarPersonaPago(tipoPersona, entrada.criterio, entrada.personaId);
  const valor = Number(entrada.valorReportado);
  if (!valor || valor <= 0) throw crearErrorAplicacion('VALOR_PAGO_INVALIDO', 'Ingrese un valor de pago mayor a cero.');
  resumen.valorReportado = valor;
  const comprobante = guardarComprobantePago(entrada.archivo, resumen);
  const registro = {
    tipoPersona: tipoPersona,
    caminanteId: tipoPersona === 'Caminante' ? resumen.id : '',
    servidorId: tipoPersona === 'Servidor' ? resumen.id : '',
    retiroId:'RETIRO_ACTUAL', valorReportado:valor, valorAprobado:'', fechaPago:String(entrada.fechaPago||''),
    medioPago:String(entrada.medioPago||''), entidadPago:String(entrada.entidadPago||''), referenciaPago:String(entrada.referenciaPago||''),
    nombrePagador:String(entrada.nombrePagador||''), telefonoPagador:validarCelularColombia(entrada.telefonoPagador,{etiqueta:'El teléfono del pagador'}),
    comprobanteUrl:comprobante.url, comprobanteId:comprobante.id, comprobanteNombre:comprobante.nombre, comprobanteTipo:comprobante.tipo, comprobanteTamano:comprobante.tamano,
    estadoPagoReportado:'Pendiente', observacionesReportante:String(entrada.observaciones||''), observacionesTesoreria:'', validadoPor:'', fechaValidacion:'',
    motivoModificacionValor:'', superaSaldo: valor > resumen.saldoPendiente ? 'Sí':'No', excedente:Math.max(valor-resumen.saldoPendiente,0), activo:'Sí', fechaRegistro:new Date(), fechaActualizacion:new Date(), actualizadoPor:'PORTAL_PAGOS'
  };
  const creado = crearRegistroSheet(HOJAS.PAGOS, registro, { usuario:'PORTAL_PAGOS' });
  return { id:creado.id, estado:'Pendiente', tipoPersona:tipoPersona, superaSaldo:registro.superaSaldo, excedente:registro.excedente };
}

function obtenerPagos(token, filtros) {
  validarPermiso(token, 'GESTIONAR_PAGOS');
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

function validarPago(token, id, decision) {
  const sesion=validarPermiso(token,'GESTIONAR_PAGOS');
  const pago=leerRegistroPorIdSheet(HOJAS.PAGOS,id,{usuario:sesion.usuario});
  const estado=normalizarTexto(decision.estado)==='aprobado'?'Aprobado':'Rechazado';
  const valorAprobado=estado==='Aprobado'?Number(decision.valorAprobado||pago.valorReportado):'';
  if (estado==='Aprobado' && (!valorAprobado || valorAprobado<=0)) throw crearErrorAplicacion('VALOR_APROBADO_INVALIDO','El valor aprobado debe ser mayor a cero.');
  if (Number(pago.valorReportado)!==Number(valorAprobado) && estado==='Aprobado' && !String(decision.motivoModificacionValor||'').trim()) throw crearErrorAplicacion('MOTIVO_REQUERIDO','Indique el motivo de la corrección del valor.');
  if (estado==='Rechazado' && !String(decision.observacionesTesoreria||'').trim()) throw crearErrorAplicacion('MOTIVO_RECHAZO_REQUERIDO','Indique el motivo del rechazo.');
  const actualizado=actualizarRegistroSheet(HOJAS.PAGOS,id,{estadoPagoReportado:estado,valorAprobado:valorAprobado,observacionesTesoreria:String(decision.observacionesTesoreria||''),motivoModificacionValor:String(decision.motivoModificacionValor||''),validadoPor:sesion.usuario,fechaValidacion:new Date(),fechaActualizacion:new Date(),actualizadoPor:sesion.usuario},{usuario:sesion.usuario});
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

function obtenerPagosCaminante(token,caminanteId){ validarPermiso(token,'CONSULTAR_CAMINANTES'); return completarResumenPagosPersona_(leerRegistroPorIdSheet(HOJAS.CAMINANTES,caminanteId,{usuario:'CONSULTA'}), 'Caminante'); }


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
  validarPermiso(token, 'GESTIONAR_PAGOS');
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
    return {
      id: persona.id,
      nombre: persona.nombreCompleto || persona.nombre || '',
      numeroInscripcion: persona.numeroInscripcion || '',
      documentoIdentidad: persona.documentoIdentidad || '',
      valorEsperado: valorIndividual,
      valorRecaudado: recaudado,
      valorPendiente: Math.max(valorIndividual - recaudado, 0),
      excedente: Math.max(recaudado - valorIndividual, 0),
      estadoPago: recaudado <= 0 ? 'Pendiente' : recaudado < valorIndividual ? 'Pago Parcial' : 'Pago Total'
    };
  });
  const valorRecaudado = detalle.reduce(function(suma, item) { return suma + item.valorRecaudado; }, 0);
  const valorEsperado = personas.length * valorIndividual;
  return {
    tipoPersona: tipoPersona,
    cantidadPersonas: personas.length,
    valorIndividual: valorIndividual,
    valorEsperado: valorEsperado,
    valorRecaudado: valorRecaudado,
    valorPendiente: Math.max(valorEsperado - valorRecaudado, 0),
    excedente: Math.max(valorRecaudado - valorEsperado, 0),
    detalle: detalle
  };
}
