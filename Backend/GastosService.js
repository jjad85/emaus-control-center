const ESTADOS_GASTO = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  REVERSADO: 'Reversado'
};

const TIPOS_COMPROBANTE_GASTO = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

const TAMANO_MAXIMO_COMPROBANTE_GASTO =
  10 * 1024 * 1024;

function obtenerGastos(token, filtros) {
  validarPermisoSesion(
    token,
    'GASTOS_VER',
    'No tiene permiso para consultar gastos.'
  );

  filtros = filtros || {};
  const estado = String(filtros.estado || '').trim();
  const categoria = normalizarTexto(filtros.categoria || '');
  const busqueda = normalizarTexto(filtros.busqueda || '');

  const items = leerHojaComoObjetos(HOJAS.GASTOS)
    .filter(function(x) {
      return convertirBooleano(x.activo);
    })
    .filter(function(x) {
      if (estado && estado !== 'Todos' && String(x.estado) !== estado) return false;
      if (categoria && categoria !== 'todos' && normalizarTexto(x.categoria) !== categoria) return false;
      if (busqueda) {
        const texto = normalizarTexto([
          x.id, x.concepto, x.categoria, x.reportadoPorNombre,
          x.personaEfectivoNombre, x.estado
        ].join(' '));
        if (texto.indexOf(busqueda) < 0) return false;
      }
      return true;
    })
    .map(convertirGasto_)
    .sort(function(a,b) {
      return new Date(b.fechaRegistro || 0) - new Date(a.fechaRegistro || 0);
    });

  const resumen = items.reduce(function(r, x) {
    const valor = Number(x.valor || 0);
    if (x.estado === ESTADOS_GASTO.APROBADO) {
      r.totalAprobado += valor;
      if (x.cruzaConEfectivo) r.totalEfectivo += valor;
      else if (x.metodoPago === 'Transferencia') r.totalTransferencia += valor;
      else r.totalOtros += valor;
    }
    if (x.estado === ESTADOS_GASTO.PENDIENTE) {
      r.pendientes += 1;
      r.valorPendiente += valor;
    }
    return r;
  }, {
    totalAprobado: 0,
    totalEfectivo: 0,
    totalTransferencia: 0,
    totalOtros: 0,
    pendientes: 0,
    valorPendiente: 0
  });

  return {
    items: items,
    resumen: resumen,
    categorias: obtenerCategoriasGasto_(),
    caja: obtenerDistribucionEfectivoGastos_(token)
  };
}

function convertirGasto_(g) {
  return {
    id: String(g.id || ''),
    fechaGasto: g.fechaGasto || '',
    categoria: String(g.categoria || ''),
    concepto: String(g.concepto || ''),
    valor: Number(g.valor || 0),
    metodoPago: String(g.metodoPago || ''),
    cruzaConEfectivo: convertirBooleano(g.cruzaConEfectivo),
    personaEfectivoId: String(g.personaEfectivoId || ''),
    personaEfectivoNombre: String(g.personaEfectivoNombre || ''),
    personaEfectivoCelular: String(g.personaEfectivoCelular || ''),
    comprobanteUrl: String(g.comprobanteUrl || ''),
    comprobanteId: String(g.comprobanteId || ''),
    comprobanteNombre: String(g.comprobanteNombre || ''),
    comprobanteTipo: String(g.comprobanteTipo || ''),
    estado: String(g.estado || ESTADOS_GASTO.PENDIENTE),
    reportadoPor: String(g.reportadoPor || ''),
    reportadoPorNombre: String(g.reportadoPorNombre || ''),
    fechaRegistro: g.fechaRegistro || '',
    validadoPor: String(g.validadoPor || ''),
    validadoPorNombre: String(g.validadoPorNombre || ''),
    fechaValidacion: g.fechaValidacion || '',
    observacionesTesoreria: String(g.observacionesTesoreria || ''),
    motivoRechazo: String(g.motivoRechazo || ''),
    revertidoPor: String(g.revertidoPor || ''),
    revertidoPorNombre: String(g.revertidoPorNombre || ''),
    fechaReversion: g.fechaReversion || '',
    motivoReversion: String(g.motivoReversion || '')
  };
}

function obtenerCategoriasGasto_() {
  const config = obtenerConfiguraciones();
  const raw = String(
    config.categoriasGastos ||
    config.CATEGORIAS_GASTOS ||
    'Alimentación,Transporte,Alojamiento,Papelería,Decoración,Logística,Audiovisuales,Liturgia,Materiales,Otros'
  );
  return raw.split(',').map(function(x) { return String(x).trim(); }).filter(Boolean);
}

function guardarComprobanteGasto_(archivo, idTemporal) {
  if (!archivo || !archivo.base64 || !archivo.nombre || !archivo.tipo) {
    throw crearErrorAplicacion(
      'COMPROBANTE_GASTO_REQUERIDO',
      'Debe adjuntar el comprobante o factura del gasto.'
    );
  }

  const tipo = String(archivo.tipo).toLowerCase();
  if (TIPOS_COMPROBANTE_GASTO.indexOf(tipo) < 0) {
    throw crearErrorAplicacion(
      'TIPO_COMPROBANTE_GASTO_INVALIDO',
      'Solo se permiten PDF, JPG, JPEG y PNG.'
    );
  }

  const bytes = Utilities.base64Decode(
    String(archivo.base64).replace(/^data:[^;]+;base64,/, '')
  );

  if (bytes.length > TAMANO_MAXIMO_COMPROBANTE_GASTO) {
    throw crearErrorAplicacion(
      'COMPROBANTE_GASTO_MUY_GRANDE',
      'El comprobante no puede superar 10 MB.'
    );
  }

  const carpetaId = PropertiesService
    .getScriptProperties()
    .getProperty('CARPETA_COMPROBANTES_GASTOS_ID');

  if (!carpetaId) {
    throw crearErrorAplicacion(
      'CARPETA_GASTOS_NO_CONFIGURADA',
      'Ejecute instalarModuloGastos antes de reportar gastos.'
    );
  }

  const extension =
    (String(archivo.nombre).match(/\.([^.]+)$/) || ['', 'bin'])[1].toLowerCase();

  const nombre =
    String(idTemporal || 'GASTO') + '_' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss') +
    '.' + extension;

  const file = DriveApp
    .getFolderById(carpetaId)
    .createFile(
      Utilities.newBlob(bytes, archivo.tipo, nombre)
    );

  return {
    id: file.getId(),
    url: file.getUrl(),
    nombre: nombre,
    tipo: archivo.tipo,
    tamano: bytes.length
  };
}

function generarIdGasto_() {
  const anio = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy'
  );

  const maximo = leerHojaComoObjetos(HOJAS.GASTOS).reduce(function(max, g) {
    const m = String(g.id || '').match(new RegExp('^G' + anio + '-(\\d+)$'));
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0);

  return 'G' + anio + '-' + String(maximo + 1).padStart(4, '0');
}

function reportarGasto(token, datos) {
  const sesion = validarPermisoSesion(
    token,
    'GASTOS_REPORTAR',
    'No tiene permiso para reportar gastos.'
  );

  const d = datos || {};
  const fechaGasto = String(d.fechaGasto || '').trim();
  const categoria = String(d.categoria || '').trim();
  const concepto = String(d.concepto || '').trim();
  const metodoPago = String(d.metodoPago || '').trim();
  const valor = Number(d.valor || 0);
  const cruza = Boolean(d.cruzaConEfectivo);

  if (!fechaGasto) throw crearErrorAplicacion('FECHA_GASTO_REQUERIDA', 'Indique la fecha del gasto.');
  if (!categoria) throw crearErrorAplicacion('CATEGORIA_GASTO_REQUERIDA', 'Seleccione la categoría.');
  if (concepto.length < 5) throw crearErrorAplicacion('CONCEPTO_GASTO_INVALIDO', 'Describa claramente el concepto del gasto.');
  if (!valor || valor <= 0) throw crearErrorAplicacion('VALOR_GASTO_INVALIDO', 'El valor debe ser mayor a cero.');
  if (['Efectivo','Transferencia','Otro'].indexOf(metodoPago) < 0) {
    throw crearErrorAplicacion('METODO_GASTO_INVALIDO', 'Seleccione un método de pago válido.');
  }

  let personaCaja = null;
  if (cruza) {
    const personaId = String(d.personaEfectivoId || '').trim();
    if (!personaId) {
      throw crearErrorAplicacion('PERSONA_CAJA_REQUERIDA', 'Seleccione la persona cuyo efectivo cubrirá el gasto.');
    }
    personaCaja = obtenerDistribucionEfectivoGastos_(token).find(function(x) {
      return String(x.servidorId) === personaId;
    });
    if (!personaCaja) throw crearErrorAplicacion('PERSONA_CAJA_INVALIDA', 'La persona seleccionada no tiene efectivo controlado.');
    if (Number(personaCaja.disponible || 0) < valor) {
      throw crearErrorAplicacion('EFECTIVO_INSUFICIENTE', 'La persona seleccionada no tiene suficiente efectivo disponible.');
    }
  }

  return ejecutarCrudConBloqueo(function() {
    const id = generarIdGasto_();
    const comprobante = guardarComprobanteGasto_(d.archivo, id);

    const registro = {
      id: id,
      fechaGasto: fechaGasto,
      categoria: categoria,
      concepto: concepto,
      valor: valor,
      metodoPago: metodoPago,
      cruzaConEfectivo: cruza ? 'Sí' : 'No',
      personaEfectivoId: personaCaja ? personaCaja.servidorId : '',
      personaEfectivoNombre: personaCaja ? personaCaja.nombre : '',
      personaEfectivoCelular: personaCaja ? personaCaja.celular : '',
      comprobanteUrl: comprobante.url,
      comprobanteId: comprobante.id,
      comprobanteNombre: comprobante.nombre,
      comprobanteTipo: comprobante.tipo,
      comprobanteTamano: comprobante.tamano,
      estado: ESTADOS_GASTO.PENDIENTE,
      reportadoPor: sesion.usuario || '',
      reportadoPorNombre: sesion.nombre || '',
      fechaRegistro: new Date(),
      validadoPor: '',
      validadoPorNombre: '',
      fechaValidacion: '',
      observacionesTesoreria: '',
      motivoRechazo: '',
      revertidoPor: '',
      revertidoPorNombre: '',
      fechaReversion: '',
      motivoReversion: '',
      activo: 'Sí',
      fechaActualizacion: new Date(),
      actualizadoPor: sesion.usuario || ''
    };

    crearRegistroSheet(HOJAS.GASTOS, registro, {
      campoId: 'id',
      campoActivo: 'activo',
      campoFechaRegistro: 'fechaRegistro',
      campoFechaActualizacion: 'fechaActualizacion',
      campoUsuarioActualizacion: 'actualizadoPor'
    });

    registrarAuditoria({
      usuario: sesion.usuario,
      nombre: sesion.nombre || '',
      accion: 'REPORTAR_GASTO',
      entidad: 'Gastos',
      idRegistro: id,
      detalle: JSON.stringify({ valor: valor, categoria: categoria, cruzaConEfectivo: cruza })
    });

    return convertirGasto_(registro);
  });
}

function validarGasto(token, id, decision) {
  const sesion = validarPermisoSesion(
    token,
    'GASTOS_APROBAR',
    'No tiene permiso para aprobar o rechazar gastos.'
  );

  const gasto = leerRegistroPorIdSheet(HOJAS.GASTOS, id, { usuario: sesion.usuario });
  if (!gasto) throw crearErrorAplicacion('GASTO_NO_ENCONTRADO', 'No se encontró el gasto.');

  if (String(gasto.estado) !== ESTADOS_GASTO.PENDIENTE) {
    throw crearErrorAplicacion('GASTO_NO_PENDIENTE', 'Solo se pueden validar gastos pendientes.');
  }

  if (normalizarTexto(gasto.reportadoPor) === normalizarTexto(sesion.usuario)) {
    throw crearErrorAplicacion(
      'SEGREGACION_GASTO',
      'No puede aprobar ni rechazar un gasto que usted mismo reportó.'
    );
  }

  const d = decision || {};
  const accion = String(d.accion || '').trim();

  if (['Aprobar','Rechazar'].indexOf(accion) < 0) {
    throw crearErrorAplicacion('DECISION_GASTO_INVALIDA', 'Indique Aprobar o Rechazar.');
  }

  if (accion === 'Rechazar' && String(d.motivo || '').trim().length < 5) {
    throw crearErrorAplicacion('MOTIVO_RECHAZO_REQUERIDO', 'Indique el motivo del rechazo.');
  }

  return ejecutarCrudConBloqueo(function() {
    if (accion === 'Aprobar' && convertirBooleano(gasto.cruzaConEfectivo)) {
      const caja = obtenerDistribucionEfectivoGastos_(token).find(function(x) {
        return String(x.servidorId) === String(gasto.personaEfectivoId);
      });
      if (!caja || Number(caja.disponible || 0) < Number(gasto.valor || 0)) {
        throw crearErrorAplicacion(
          'EFECTIVO_INSUFICIENTE_APROBACION',
          'El efectivo disponible cambió y ya no alcanza para aprobar este gasto.'
        );
      }
    }

    const cambios = {
      estado: accion === 'Aprobar' ? ESTADOS_GASTO.APROBADO : ESTADOS_GASTO.RECHAZADO,
      validadoPor: sesion.usuario || '',
      validadoPorNombre: sesion.nombre || '',
      fechaValidacion: new Date(),
      observacionesTesoreria: String(d.observaciones || ''),
      motivoRechazo: accion === 'Rechazar' ? String(d.motivo || '') : '',
      fechaActualizacion: new Date(),
      actualizadoPor: sesion.usuario || ''
    };

    actualizarRegistroSheet(HOJAS.GASTOS, id, cambios, { usuario: sesion.usuario });

    registrarAuditoria({
      usuario: sesion.usuario,
      nombre: sesion.nombre || '',
      accion: accion === 'Aprobar' ? 'APROBAR_GASTO' : 'RECHAZAR_GASTO',
      entidad: 'Gastos',
      idRegistro: id,
      detalle: JSON.stringify(cambios)
    });

    return convertirGasto_(
      leerRegistroPorIdSheet(HOJAS.GASTOS, id, { usuario: sesion.usuario })
    );
  });
}

function revertirGasto(token, id, motivo) {
  const sesion = validarPermisoSesion(
    token,
    'GASTOS_REVERSAR',
    'No tiene permiso para reversar gastos.'
  );

  const gasto = leerRegistroPorIdSheet(HOJAS.GASTOS, id, { usuario: sesion.usuario });
  if (!gasto) throw crearErrorAplicacion('GASTO_NO_ENCONTRADO', 'No se encontró el gasto.');
  if (String(gasto.estado) !== ESTADOS_GASTO.APROBADO) {
    throw crearErrorAplicacion('GASTO_NO_APROBADO', 'Solo se pueden reversar gastos aprobados.');
  }
  if (String(motivo || '').trim().length < 5) {
    throw crearErrorAplicacion('MOTIVO_REVERSION_REQUERIDO', 'Indique el motivo de la reversión.');
  }

  actualizarRegistroSheet(HOJAS.GASTOS, id, {
    estado: ESTADOS_GASTO.REVERSADO,
    revertidoPor: sesion.usuario || '',
    revertidoPorNombre: sesion.nombre || '',
    fechaReversion: new Date(),
    motivoReversion: String(motivo).trim(),
    fechaActualizacion: new Date(),
    actualizadoPor: sesion.usuario || ''
  }, { usuario: sesion.usuario });

  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre || '',
    accion: 'REVERSAR_GASTO',
    entidad: 'Gastos',
    idRegistro: id,
    detalle: String(motivo)
  });

  return convertirGasto_(
    leerRegistroPorIdSheet(HOJAS.GASTOS, id, { usuario: sesion.usuario })
  );
}

function obtenerDistribucionEfectivoGastos_(token) {
  validarPermisoSesion(
    token,
    'GASTOS_VER',
    'No tiene permiso para consultar caja.'
  );

  const servidores = leerHojaComoObjetos(HOJAS.SERVIDORES);
  const porId = {};
  servidores.forEach(function(s) {
    porId[String(s.id)] = {
      servidorId: String(s.id || ''),
      nombre: String(s.nombreCompleto || s.nombre || ''),
      celular: String(s.celular || ''),
      recibido: 0,
      gastos: 0,
      disponible: 0,
      movimientosGastos: []
    };
  });

  leerHojaComoObjetos(HOJAS.PAGOS)
    .filter(function(p) {
      return normalizarTexto(p.estadoPagoReportado || p.estado) === 'aprobado' &&
        normalizarTexto(p.medioPago) === 'efectivo';
    })
    .forEach(function(p) {
      const nombre = normalizarTexto(p.nombrePagador || '');
      const telefono = String(p.telefonoPagador || '').trim();
      const servidor = servidores.find(function(s) {
        return (telefono && String(s.celular || '').trim() === telefono) ||
          (nombre && normalizarTexto(s.nombreCompleto || s.nombre || '') === nombre);
      });
      if (servidor && porId[String(servidor.id)]) {
        porId[String(servidor.id)].recibido += Number(p.valorAprobado || p.valorReportado || 0);
      }
    });

  leerHojaComoObjetos(HOJAS.GASTOS)
    .filter(function(g) {
      return String(g.estado) === ESTADOS_GASTO.APROBADO &&
        convertirBooleano(g.cruzaConEfectivo);
    })
    .forEach(function(g) {
      const item = porId[String(g.personaEfectivoId || '')];
      if (item) {
        item.gastos += Number(g.valor || 0);
        item.movimientosGastos.push({
          id: String(g.id || ''),
          fechaGasto: g.fechaGasto || '',
          concepto: String(g.concepto || ''),
          categoria: String(g.categoria || ''),
          valor: Number(g.valor || 0),
          comprobanteUrl: String(g.comprobanteUrl || '')
        });
      }
    });

  return Object.keys(porId).map(function(id) {
    const x = porId[id];
    x.disponible = Math.max(x.recibido - x.gastos, 0);
    return x;
  }).filter(function(x) {
    return x.recibido > 0 || x.gastos > 0;
  }).sort(function(a,b) {
    return b.disponible - a.disponible;
  });
}

function obtenerDistribucionEfectivoGastos(token) {
  return obtenerDistribucionEfectivoGastos_(token);
}
