/**
 * ============================================================
 * WHATSAPP NOTIFICACIONES SERVICE
 * ============================================================
 * Modelo gratuito y semiautomático:
 * - El sistema crea pendientes.
 * - Un usuario autorizado abre WhatsApp desde su sesión activa.
 * - El usuario confirma manualmente que envió el mensaje.
 */

const HOJA_NOTIFICACIONES_WHATSAPP = 'NotificacionesWhatsApp';

const TIPOS_NOTIFICACION_WHATSAPP = {
  INSCRIPCION: 'INSCRIPCION',
  APROBACION: 'APROBACION',
  CANCELACION: 'CANCELACION',
  PAGO_RECHAZADO: 'PAGO_RECHAZADO',
  AUTORIZACIONES: 'AUTORIZACIONES'
};

const ESTADOS_NOTIFICACION_WHATSAPP = {
  PENDIENTE: 'Pendiente',
  ABIERTA: 'Abierta',
  CONFIRMADA: 'Confirmada',
  OMITIDA: 'Omitida'
};

function crearNotificacionWhatsappPendiente(datos) {
  const entrada = datos || {};
  const entidadId = String(entrada.entidadId || '').trim();
  const tipo = String(entrada.tipo || '').trim().toUpperCase();

  if (!entidadId || !tipo) {
    return null;
  }

  const existentes = leerNotificacionesWhatsapp_();

  /*
   * Una notificación confirmada también cuenta como existente.
   *
   * Antes se buscaban solamente registros no confirmados. Como la
   * sincronización se ejecuta cada vez que se consulta la campana,
   * después de confirmar un envío no encontraba el registro confirmado
   * y creaba otro pendiente idéntico.
   */
  const existente = existentes.find(function(item) {
    return (
      convertirBooleano(item.activo) &&
      String(item.entidadId) === entidadId &&
      normalizarTexto(item.entidad) ===
        normalizarTexto(entrada.entidad) &&
      normalizarTexto(item.tipo) === normalizarTexto(tipo)
    );
  });

  if (existente) {
    return existente;
  }

  const ahora = new Date();
  const registro = {
    id: Utilities.getUuid(),
    tipo: tipo,
    entidad: String(entrada.entidad || '').trim(),
    entidadId: entidadId,
    nombre: String(entrada.nombre || '').trim(),
    telefono: String(entrada.telefono || '').trim(),
    motivo: String(entrada.motivo || '').trim(),
    estado: ESTADOS_NOTIFICACION_WHATSAPP.PENDIENTE,
    fechaCreacion: ahora,
    fechaApertura: '',
    fechaConfirmacion: '',
    fechaOmitision: '',
    abiertoPor: '',
    confirmadoPor: '',
    omitidoPor: '',
    motivoOmitision: '',
    activo: 'Sí'
  };

  agregarNotificacionWhatsapp_(registro);

  return registro;
}

function obtenerNotificacionesWhatsapp(token, filtros) {
  sincronizarNotificacionesWhatsappPendientes_();

  const sesion = obtenerSesion(token);
  const permisos = obtenerPermisosPorRol(sesion.rol);

  const puedeVer =
    permisos.includes('NOTIFICAR_ASPIRANTE') ||
    permisos.includes('NOTIFICAR_CAMINANTE') ||
    permisos.includes('CONVERTIR_ASPIRANTE');

  if (!puedeVer) {
    throw crearErrorAplicacion(
      'PERMISO_DENEGADO',
      'No tiene permisos para consultar notificaciones de WhatsApp.'
    );
  }

  const parametros = filtros || {};
  const incluirGestionadas =
    convertirBooleano(parametros.incluirGestionadas) ||
    convertirBooleano(parametros.incluirConfirmadas);

  const items = leerNotificacionesWhatsapp_()
    .filter(function(item) {
      if (!convertirBooleano(item.activo)) {
        return false;
      }

      if (
        !incluirGestionadas &&
        (
          normalizarTexto(item.estado) === 'confirmada' ||
          normalizarTexto(item.estado) === 'omitida'
        )
      ) {
        return false;
      }

      if (
        parametros.entidad &&
        normalizarTexto(item.entidad) !== normalizarTexto(parametros.entidad)
      ) {
        return false;
      }

      if (
        parametros.entidadId &&
        String(item.entidadId) !== String(parametros.entidadId)
      ) {
        return false;
      }

      return puedeGestionarTipoWhatsapp_(permisos, item.tipo);
    })
    .sort(function(a, b) {
      return new Date(a.fechaCreacion).getTime() -
        new Date(b.fechaCreacion).getTime();
    });

  return {
    total: items.length,
    pendientes: items.filter(function(item) {
      return normalizarTexto(item.estado) === 'pendiente';
    }).length,
    abiertas: items.filter(function(item) {
      return normalizarTexto(item.estado) === 'abierta';
    }).length,
    confirmadas: items.filter(function(item) {
      return normalizarTexto(item.estado) === 'confirmada';
    }).length,
    omitidas: items.filter(function(item) {
      return normalizarTexto(item.estado) === 'omitida';
    }).length,
    pendientesGestion: items.filter(function(item) {
      const estado = normalizarTexto(item.estado);
      return estado !== 'confirmada' && estado !== 'omitida';
    }).length,
    items: items
  };
}

function prepararNotificacionWhatsapp(token, id) {
  const sesion = obtenerSesion(token);
  const permisos = obtenerPermisosPorRol(sesion.rol);
  const notificacion = obtenerNotificacionWhatsappPorId_(id);

  if (!puedeGestionarTipoWhatsapp_(permisos, notificacion.tipo)) {
    throw crearErrorAplicacion(
      'PERMISO_DENEGADO',
      'No tiene permiso para gestionar esta notificación.'
    );
  }

  if (
    normalizarTexto(notificacion.estado) === 'confirmada' ||
    normalizarTexto(notificacion.estado) === 'omitida'
  ) {
    throw crearErrorAplicacion(
      'NOTIFICACION_YA_GESTIONADA',
      'La notificación ya fue gestionada.'
    );
  }

  const configuracion = obtenerConfiguraciones();
  const plantilla = obtenerPlantillaWhatsapp_(notificacion.tipo, configuracion);
  let detalleMotivo = {};
  try { detalleMotivo = JSON.parse(String(notificacion.motivo || '{}')); } catch (error) { detalleMotivo = {}; }

  const mensaje = reemplazarVariablesWhatsapp_(plantilla, {
    nombre: notificacion.nombre,
    motivo: notificacion.motivo,
    link: detalleMotivo.link || '',
    minutos: detalleMotivo.minutos || '',
    tipoRetiro: configuracion.tipoRetiro || '',
    anioRetiro: configuracion.anioRetiro || '',
    numeroInscripcion: obtenerNumeroInscripcionWhatsapp_(notificacion)
  });

  const telefono = normalizarTelefonoWhatsapp_(
    notificacion.telefono,
    configuracion.whatsappCodigoPais || '57'
  );

  if (!telefono) {
    throw crearErrorAplicacion(
      'TELEFONO_WHATSAPP_INVALIDO',
      'El número de celular no es válido para WhatsApp.'
    );
  }

  actualizarNotificacionWhatsapp_(id, {
    estado: ESTADOS_NOTIFICACION_WHATSAPP.ABIERTA,
    fechaApertura: new Date(),
    abiertoPor: sesion.usuario || ''
  });

  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre,
    accion: 'ABRIR_NOTIFICACION_WHATSAPP',
    entidad: 'NotificacionesWhatsApp',
    idRegistro: id,
    detalle: JSON.stringify({
      tipo: notificacion.tipo,
      entidad: notificacion.entidad,
      entidadId: notificacion.entidadId,
      telefono: telefono
    })
  });

  return {
    id: id,
    telefono: telefono,
    mensaje: mensaje,
    url: 'https://wa.me/' + telefono + '?text=' + encodeURIComponent(mensaje),
    estado: ESTADOS_NOTIFICACION_WHATSAPP.ABIERTA
  };
}

function confirmarNotificacionWhatsapp(token, id) {
  const sesion = obtenerSesion(token);
  const permisos = obtenerPermisosPorRol(sesion.rol);
  const notificacion = obtenerNotificacionWhatsappPorId_(id);

  if (!puedeGestionarTipoWhatsapp_(permisos, notificacion.tipo)) {
    throw crearErrorAplicacion(
      'PERMISO_DENEGADO',
      'No tiene permiso para confirmar esta notificación.'
    );
  }

  const actualizado = actualizarNotificacionWhatsapp_(id, {
    estado: ESTADOS_NOTIFICACION_WHATSAPP.CONFIRMADA,
    fechaConfirmacion: new Date(),
    confirmadoPor: sesion.usuario || ''
  });

  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre,
    accion: 'CONFIRMAR_NOTIFICACION_WHATSAPP',
    entidad: 'NotificacionesWhatsApp',
    idRegistro: id,
    detalle: JSON.stringify({
      tipo: notificacion.tipo,
      entidad: notificacion.entidad,
      entidadId: notificacion.entidadId
    })
  });

  return actualizado;
}


function omitirNotificacionWhatsapp(token, id, motivo) {
  const sesion = obtenerSesion(token);
  const permisos = obtenerPermisosPorRol(sesion.rol);
  const notificacion = obtenerNotificacionWhatsappPorId_(id);
  const razon = String(motivo || '').trim();

  if (!puedeGestionarTipoWhatsapp_(permisos, notificacion.tipo)) {
    throw crearErrorAplicacion(
      'PERMISO_DENEGADO',
      'No tiene permiso para omitir esta notificación.'
    );
  }

  if (!razon) {
    throw crearErrorAplicacion(
      'MOTIVO_OMISION_REQUERIDO',
      'Debe indicar por qué no se enviará la notificación.'
    );
  }

  if (
    normalizarTexto(notificacion.estado) === 'confirmada' ||
    normalizarTexto(notificacion.estado) === 'omitida'
  ) {
    throw crearErrorAplicacion(
      'NOTIFICACION_YA_GESTIONADA',
      'La notificación ya fue gestionada.'
    );
  }

  const actualizado = actualizarNotificacionWhatsapp_(id, {
    estado: ESTADOS_NOTIFICACION_WHATSAPP.OMITIDA,
    fechaOmitision: new Date(),
    omitidoPor: sesion.usuario || '',
    motivoOmitision: razon
  });

  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre,
    accion: 'OMITIR_NOTIFICACION_WHATSAPP',
    entidad: 'NotificacionesWhatsApp',
    idRegistro: id,
    detalle: JSON.stringify({
      tipo: notificacion.tipo,
      entidad: notificacion.entidad,
      entidadId: notificacion.entidadId,
      motivo: razon
    })
  });

  return actualizado;
}

function obtenerResumenNotificacionesWhatsappParaCampana(token) {
  sincronizarNotificacionesWhatsappPendientes_();

  const resultado = obtenerNotificacionesWhatsapp(token, {});
  const items = [];
  const agrupados = {};

  resultado.items.forEach(function(item) {
    const tipo = String(item.tipo || '').toUpperCase();
    agrupados[tipo] = (agrupados[tipo] || 0) + 1;
  });

  Object.keys(agrupados).forEach(function(tipo) {
    const cantidad = agrupados[tipo];
    const etiquetas = {
      INSCRIPCION: 'inscripciones pendientes por notificar',
      APROBACION: 'aprobaciones pendientes por notificar',
      CANCELACION: 'cancelaciones pendientes por notificar',
      PAGO_RECHAZADO: 'pagos rechazados pendientes por notificar'
    };

    items.push({
      id: 'WHATSAPP_' + tipo,
      tipo: 'whatsapp',
      titulo: cantidad + ' ' + (etiquetas[tipo] || 'mensajes pendientes'),
      mensaje: 'Abre el centro de notificaciones para gestionarlos.',
      cantidad: cantidad,
      ruta: '/notificaciones-whatsapp',
      permiso: tipo === 'INSCRIPCION' || tipo === 'APROBACION'
        ? 'NOTIFICAR_ASPIRANTE'
        : 'NOTIFICAR_CAMINANTE'
    });
  });

  return {
    totalPendientes: resultado.total,
    items: items
  };
}

function obtenerNotificacionWhatsappPendienteEntidad(entidad, entidadId) {
  return leerNotificacionesWhatsapp_().find(function(item) {
    return (
      convertirBooleano(item.activo) &&
      normalizarTexto(item.entidad) === normalizarTexto(entidad) &&
      String(item.entidadId) === String(entidadId) &&
      (normalizarTexto(item.estado) !== 'confirmada' && normalizarTexto(item.estado) !== 'omitida')
    );
  }) || null;
}

function enriquecerConWhatsapp(items, entidad) {
  const notificaciones = leerNotificacionesWhatsapp_();

  return (items || []).map(function(item) {
    const pendientes = notificaciones
      .filter(function(notificacion) {
        return (
          convertirBooleano(notificacion.activo) &&
          normalizarTexto(notificacion.entidad) ===
            normalizarTexto(entidad) &&
          String(notificacion.entidadId) === String(item.id) &&
          (normalizarTexto(notificacion.estado) !== 'confirmada' && normalizarTexto(notificacion.estado) !== 'omitida')
        );
      })
      .map(function(notificacion) {
        return {
          id: notificacion.id,
          tipo: notificacion.tipo,
          estado: notificacion.estado
        };
      });

    return Object.assign({}, item, {
      whatsappNotificaciones: pendientes,
      whatsappNotificacion: pendientes[0] || null
    });
  });
}

/**
 * Garantiza que todos los registros existentes tengan sus pendientes.
 *
 * Esto corrige instalaciones hechas después de que ya existían aspirantes
 * y caminantes. La sincronización es idempotente: no crea duplicados
 * mientras exista una notificación no confirmada del mismo tipo.
 */
function sincronizarNotificacionesWhatsappPendientes_() {
  const aspirantes = leerHojaComoObjetos(HOJAS.ASPIRANTES);

  aspirantes.forEach(function(aspirante) {
    if (!convertirBooleano(aspirante.activo)) {
      return;
    }

    crearNotificacionWhatsappPendiente({
      tipo: TIPOS_NOTIFICACION_WHATSAPP.INSCRIPCION,
      entidad: 'Aspirantes',
      entidadId: aspirante.id,
      nombre: obtenerDestinatarioRegistro(aspirante).nombre,
      telefono: obtenerDestinatarioRegistro(aspirante).telefono
    });

    const estado = normalizarTexto(aspirante.estadoSolicitud);

    if (
      estado === 'convertido' ||
      estado === 'aprobado' ||
      String(aspirante.caminanteId || '').trim()
    ) {
      crearNotificacionWhatsappPendiente({
        tipo: TIPOS_NOTIFICACION_WHATSAPP.APROBACION,
        entidad: 'Aspirantes',
        entidadId: aspirante.id,
        nombre: obtenerDestinatarioRegistro(aspirante).nombre,
        telefono: obtenerDestinatarioRegistro(aspirante).telefono
      });
    }
  });

  const caminantes = leerHojaComoObjetos(HOJAS.CAMINANTES);

  caminantes.forEach(function(caminante) {
    const cancelado =
      !convertirBooleano(caminante.activo) &&
      String(caminante.motivoCancelacion || '').trim();

    if (!cancelado) {
      return;
    }

    crearNotificacionWhatsappPendiente({
      tipo: TIPOS_NOTIFICACION_WHATSAPP.CANCELACION,
      entidad: 'Caminantes',
      entidadId: caminante.id,
      nombre: caminante.nombre,
      telefono: caminante.telefono,
      motivo: caminante.motivoCancelacion
    });
  });

  return true;
}

function puedeGestionarTipoWhatsapp_(permisos, tipo) {
  const tipoNormalizado = String(tipo || '').toUpperCase();

  if (
    tipoNormalizado === TIPOS_NOTIFICACION_WHATSAPP.INSCRIPCION ||
    tipoNormalizado === TIPOS_NOTIFICACION_WHATSAPP.APROBACION
  ) {
    return (
      permisos.includes('NOTIFICAR_ASPIRANTE') ||
      permisos.includes('CONVERTIR_ASPIRANTE')
    );
  }

  if (tipoNormalizado === TIPOS_NOTIFICACION_WHATSAPP.AUTORIZACIONES) {
    return permisos.includes('ENVIAR_AUTORIZACIONES_CAMINANTE');
  }

  if (tipoNormalizado === TIPOS_NOTIFICACION_WHATSAPP.CANCELACION || tipoNormalizado === TIPOS_NOTIFICACION_WHATSAPP.PAGO_RECHAZADO) {
    return (
      permisos.includes('NOTIFICAR_CAMINANTE') ||
      permisos.includes('DESACTIVAR_CAMINANTE')
    );
  }

  return false;
}

function obtenerPlantillaWhatsapp_(tipo, configuracion) {
  const plantillas = {};
  plantillas[TIPOS_NOTIFICACION_WHATSAPP.INSCRIPCION] =
    configuracion.whatsappMensajeInscripcion ||
    'Hola {{nombre}}. Gracias por inscribirte. Tu solicitud quedó registrada como aspirante para el Retiro de Emaús {{tipoRetiro}} {{anioRetiro}}.';
  plantillas[TIPOS_NOTIFICACION_WHATSAPP.APROBACION] =
    configuracion.whatsappMensajeAprobacion ||
    'Hola {{nombre}}. Luego de revisar tu inscripción, has sido aceptado como caminante. Bienvenido a este camino de Emaús.';
  plantillas[TIPOS_NOTIFICACION_WHATSAPP.CANCELACION] =
    configuracion.whatsappMensajeCancelacion ||
    'Hola {{nombre}}. Te informamos que tu participación en el retiro fue cancelada. Motivo: {{motivo}}.';
  plantillas[TIPOS_NOTIFICACION_WHATSAPP.PAGO_RECHAZADO] =
    configuracion.whatsappMensajePagoRechazado ||
    'Hola {{nombre}}. El comprobante de pago fue rechazado. Motivo: {{motivo}}. Por favor ingresa nuevamente a Reportar pago y carga un nuevo comprobante.';
  plantillas[TIPOS_NOTIFICACION_WHATSAPP.AUTORIZACIONES] =
    configuracion.whatsappMensajeAutorizaciones ||
    'Hola {{nombre}}. Para finalizar tu inscripción, responde las autorizaciones aquí: {{link}}. El enlace estará disponible durante {{minutos}} minutos.';

  return plantillas[String(tipo || '').toUpperCase()] || '';
}

function reemplazarVariablesWhatsapp_(plantilla, variables) {
  return String(plantilla || '').replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    function(coincidencia, clave) {
      return variables[clave] === undefined ||
        variables[clave] === null
        ? ''
        : String(variables[clave]);
    }
  );
}

function normalizarTelefonoWhatsapp_(telefono, codigoPais) {
  let numero = String(telefono || '').replace(/\D/g, '');
  const codigo = String(codigoPais || '57').replace(/\D/g, '') || '57';

  if (!numero) {
    return '';
  }

  if (numero.startsWith('00')) {
    numero = numero.substring(2);
  }

  if (numero.length === 10) {
    numero = codigo + numero;
  }

  if (numero.length < 11 || numero.length > 15) {
    return '';
  }

  return numero;
}

function obtenerNumeroInscripcionWhatsapp_(notificacion) {
  if (normalizarTexto(notificacion.entidad) !== 'aspirantes') {
    return '';
  }

  try {
    const aspirante = obtenerAspirantePorId(notificacion.entidadId);
    return aspirante.numeroInscripcion || '';
  } catch (error) {
    return '';
  }
}


function agregarNotificacionWhatsapp_(registro) {
  const hoja = obtenerHojaNotificacionesWhatsapp_();
  const encabezados = hoja
    .getRange(1, 1, 1, hoja.getLastColumn())
    .getValues()[0]
    .map(function(valor) {
      return String(valor || '').trim();
    });

  const fila = encabezados.map(function(encabezado) {
    return registro[encabezado] === undefined
      ? ''
      : registro[encabezado];
  });

  hoja.appendRow(fila);
}

function obtenerHojaNotificacionesWhatsapp_() {
  const libro = obtenerLibro();
  const hoja = libro.getSheetByName(HOJA_NOTIFICACIONES_WHATSAPP);

  if (!hoja) {
    throw crearErrorAplicacion(
      'HOJA_WHATSAPP_NO_INSTALADA',
      'Falta ejecutar instalarModuloWhatsappEmaus().'
    );
  }

  return hoja;
}

function leerNotificacionesWhatsapp_() {
  const hoja = obtenerHojaNotificacionesWhatsapp_();
  const valores = hoja.getDataRange().getValues();

  if (valores.length <= 1) {
    return [];
  }

  const encabezados = valores[0].map(function(valor) {
    return String(valor || '').trim();
  });

  return valores.slice(1).map(function(fila, indice) {
    const item = { _fila: indice + 2 };

    encabezados.forEach(function(encabezado, posicion) {
      item[encabezado] = fila[posicion];
    });

    return item;
  });
}

function obtenerNotificacionWhatsappPorId_(id) {
  const item = leerNotificacionesWhatsapp_().find(function(registro) {
    return String(registro.id) === String(id);
  });

  if (!item) {
    throw crearErrorAplicacion(
      'NOTIFICACION_WHATSAPP_NO_ENCONTRADA',
      'No existe la notificación solicitada.'
    );
  }

  return item;
}

function actualizarNotificacionWhatsapp_(id, cambios) {
  const hoja = obtenerHojaNotificacionesWhatsapp_();
  const item = obtenerNotificacionWhatsappPorId_(id);
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];

  Object.keys(cambios || {}).forEach(function(clave) {
    const indice = encabezados.indexOf(clave);

    if (indice >= 0) {
      hoja.getRange(item._fila, indice + 1).setValue(cambios[clave]);
      item[clave] = cambios[clave];
    }
  });

  return item;
}
