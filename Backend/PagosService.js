/** Gestión integral de pagos del retiro. */
const ESTADOS_REPORTE_PAGO = ['Pendiente', 'Aprobado', 'Rechazado'];
const TAMANO_MAXIMO_COMPROBANTE = 5 * 1024 * 1024;
const TIPOS_COMPROBANTE = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

function obtenerValorRetiroActual() {
  const configuraciones = leerHojaComoObjetos(HOJAS.CONFIGURACIONES);
  const item = configuraciones.find(function(x) {
    return normalizarTexto(x.clave) === 'valor retiro actual' || normalizarTexto(x.clave) === 'valor_retiro_actual';
  });
  const valor = Number(String(item && item.valor || '').replace(/[^0-9.-]/g, ''));
  if (!valor || valor <= 0) throw crearErrorAplicacion('VALOR_RETIRO_NO_CONFIGURADO', 'Configure el parámetro VALOR_RETIRO_ACTUAL con un valor mayor a cero.');
  return valor;
}

function obtenerDestinatarioRegistro(registro) {
  const esInvitador = ['invitador', 'otra persona'].includes(normalizarTexto(registro.tipoRegistrante));
  return esInvitador
    ? { nombre: registro.nombreRegistrante || registro.nombre || '', telefono: normalizarCelularColombia(registro.telefonoRegistrante) }
    : { nombre: registro.nombreCompleto || registro.nombre || '', telefono: normalizarCelularColombia(registro.celular || registro.telefono) };
}

function buscarCaminantePago(criterio) {
  const consulta = normalizarTexto(criterio);
  if (!consulta) throw crearErrorAplicacion('CRITERIO_REQUERIDO', 'Ingrese el código de inscripción o el documento del caminante.');
  const caminantes = obtenerCaminantes({}).filter(function(x){ return convertirBooleano(x.activo); });
  const aspirantes = leerHojaComoObjetos(HOJAS.ASPIRANTES);
  const caminante = caminantes.find(function(c) {
    const aspirante = aspirantes.find(function(a){ return String(a.id) === String(c.aspiranteId) || String(a.caminanteId) === String(c.id); }) || {};
    return [c.numeroInscripcion, c.documentoIdentidad, aspirante.numeroInscripcion, aspirante.documentoIdentidad]
      .some(function(v){ return normalizarTexto(v) === consulta; });
  });
  if (!caminante) throw crearErrorAplicacion('CAMINANTE_NO_ENCONTRADO', 'No encontramos un caminante con ese código o documento.');
  return completarResumenPagosCaminante(caminante);
}

function completarResumenPagosCaminante(caminante) {
  const pagos = leerHojaComoObjetos(HOJAS.PAGOS).filter(function(p){ return String(p.caminanteId) === String(caminante.id); });
  const aprobados = pagos.filter(function(p){ return normalizarTexto(p.estadoPagoReportado || p.estado) === 'aprobado'; });
  const totalAprobado = aprobados.reduce(function(s,p){ return s + Number(p.valorAprobado || p.valorReportado || 0); }, 0);
  const valorRetiro = obtenerValorRetiroActual();
  return {
    id: caminante.id,
    nombre: caminante.nombreCompleto || caminante.nombre,
    numeroInscripcion: caminante.numeroInscripcion || '',
    documentoIdentidad: caminante.documentoIdentidad || '',
    estadoPago: totalAprobado <= 0 ? 'Pendiente' : totalAprobado < valorRetiro ? 'Pago Parcial' : 'Pago Total',
    valorRetiro: valorRetiro,
    totalAprobado: totalAprobado,
    saldoPendiente: Math.max(valorRetiro - totalAprobado, 0),
    excedente: Math.max(totalAprobado - valorRetiro, 0),
    pagos: pagos.map(normalizarPagoRespuesta)
  };
}

function normalizarPagoRespuesta(p, caminante) {
  const persona = caminante || {};
  const comprobanteId = String(p.comprobanteId || '').trim();

  return {
    id: p.id,
    caminanteId: p.caminanteId,
    caminanteNombre: persona.nombreCompleto || persona.nombre || '',
    numeroInscripcion: persona.numeroInscripcion || '',
    documentoIdentidad: persona.documentoIdentidad || '',
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

function guardarComprobantePago(archivo, caminanteId) {
  if (!archivo || !archivo.base64 || !archivo.nombre || !archivo.tipo) throw crearErrorAplicacion('COMPROBANTE_REQUERIDO', 'Adjunte el comprobante de pago.');
  if (!TIPOS_COMPROBANTE.includes(String(archivo.tipo).toLowerCase())) throw crearErrorAplicacion('TIPO_COMPROBANTE_INVALIDO', 'Solo se permiten PDF, JPG, JPEG y PNG.');
  const bytes = Utilities.base64Decode(String(archivo.base64).replace(/^data:[^;]+;base64,/, ''));
  if (bytes.length > TAMANO_MAXIMO_COMPROBANTE) throw crearErrorAplicacion('COMPROBANTE_MUY_GRANDE', 'El comprobante no puede superar 5 MB.');
  const props = PropertiesService.getScriptProperties();
  const carpetaId = props.getProperty('CARPETA_COMPROBANTES_PAGOS_ID');
  if (!carpetaId) throw crearErrorAplicacion('CARPETA_PAGOS_NO_CONFIGURADA', 'Ejecute instalarModuloPagos antes de recibir pagos.');
  const carpeta = DriveApp.getFolderById(carpetaId);
  const nombre = 'PAGO_' + caminanteId + '_' + new Date().getTime() + '_' + String(archivo.nombre).replace(/[^a-zA-Z0-9._-]/g,'_');
  const blob = Utilities.newBlob(bytes, archivo.tipo, nombre);
  const file = carpeta.createFile(blob);
  return { id:file.getId(), url:file.getUrl(), nombre:nombre, tipo:archivo.tipo, tamano:bytes.length };
}

function reportarPagoPublico(datos) {
  const entrada = datos || {};
  const resumen = buscarCaminantePago(entrada.criterio);
  const valor = Number(entrada.valorReportado);
  if (!valor || valor <= 0) throw crearErrorAplicacion('VALOR_PAGO_INVALIDO', 'Ingrese un valor de pago mayor a cero.');
  const comprobante = guardarComprobantePago(entrada.archivo, resumen.id);
  const registro = {
    caminanteId: resumen.id, retiroId:'RETIRO_ACTUAL', valorReportado:valor, valorAprobado:'', fechaPago:String(entrada.fechaPago||''),
    medioPago:String(entrada.medioPago||''), entidadPago:String(entrada.entidadPago||''), referenciaPago:String(entrada.referenciaPago||''),
    nombrePagador:String(entrada.nombrePagador||''), telefonoPagador:validarCelularColombia(entrada.telefonoPagador,{etiqueta:'El teléfono del pagador'}),
    comprobanteUrl:comprobante.url, comprobanteId:comprobante.id, comprobanteNombre:comprobante.nombre, comprobanteTipo:comprobante.tipo, comprobanteTamano:comprobante.tamano,
    estadoPagoReportado:'Pendiente', observacionesReportante:String(entrada.observaciones||''), observacionesTesoreria:'', validadoPor:'', fechaValidacion:'',
    motivoModificacionValor:'', superaSaldo: valor > resumen.saldoPendiente ? 'Sí':'No', excedente:Math.max(valor-resumen.saldoPendiente,0), activo:'Sí', fechaRegistro:new Date(), fechaActualizacion:new Date(), actualizadoPor:'PORTAL_PUBLICO'
  };
  const creado = crearRegistroSheet(HOJAS.PAGOS, registro, { usuario:'PORTAL_PUBLICO' });
  return { id:creado.id, estado:'Pendiente', superaSaldo:registro.superaSaldo, excedente:registro.excedente };
}

function obtenerPagos(token, filtros) {
  validarPermiso(token, 'GESTIONAR_PAGOS');
  const f = filtros || {};
  const caminantesPorId = {};

  leerHojaComoObjetos(HOJAS.CAMINANTES).forEach(function(caminante) {
    caminantesPorId[String(caminante.id)] = caminante;
  });

  return leerHojaComoObjetos(HOJAS.PAGOS)
    .filter(function(p) {
      return (
        (!f.estado || normalizarTexto(p.estadoPagoReportado) === normalizarTexto(f.estado)) &&
        (!f.caminanteId || String(p.caminanteId) === String(f.caminanteId))
      );
    })
    .map(function(pago) {
      return normalizarPagoRespuesta(
        pago,
        caminantesPorId[String(pago.caminanteId)] || {}
      );
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
  if (estado === 'Rechazado') {
    const caminante = leerRegistroPorIdSheet(HOJAS.CAMINANTES, pago.caminanteId, {usuario:sesion.usuario});
    const destino = obtenerDestinatarioRegistro(caminante);
    crearNotificacionWhatsappPendiente({ tipo:TIPOS_NOTIFICACION_WHATSAPP.PAGO_RECHAZADO, entidad:'Pagos', entidadId:id, nombre:destino.nombre, telefono:destino.telefono, motivo:String(decision.observacionesTesoreria||'') });
  }
  recalcularEstadoPagoCaminante(pago.caminanteId,sesion.usuario);
  return normalizarPagoRespuesta(actualizado);
}

function recalcularEstadoPagoCaminante(caminanteId, usuario) {
  const caminante=leerRegistroPorIdSheet(HOJAS.CAMINANTES,caminanteId,{usuario:usuario});
  const resumen=completarResumenPagosCaminante(caminante);
  actualizarRegistroSheet(HOJAS.CAMINANTES,caminanteId,{estadoPago:resumen.estadoPago,totalAbonado:resumen.totalAprobado,saldoPendiente:resumen.saldoPendiente,excedentePago:resumen.excedente,fechaActualizacion:new Date(),actualizadoPor:usuario},{usuario:usuario});
  return resumen;
}

function obtenerPagosCaminante(token,caminanteId){ validarPermiso(token,'CONSULTAR_CAMINANTES'); return completarResumenPagosCaminante(leerRegistroPorIdSheet(HOJAS.CAMINANTES,caminanteId,{usuario:'CONSULTA'})); }
