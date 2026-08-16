/**
 * ============================================================
 * NOTIFICACIONES SERVICE
 * ============================================================
 * Construye notificaciones dinámicas según los permisos
 * del usuario autenticado.
 */

/**
 * Obtiene las notificaciones visibles para el usuario.
 *
 * En esta primera versión se informa la cantidad de aspirantes
 * activos que todavía no han sido convertidos ni rechazados.
 */
function obtenerNotificaciones(token) {
  const sesion = obtenerSesion(token);
  const permisos = obtenerPermisosPorRol(sesion.rol);
  const items = [];
  let totalPendientes = 0;

  if (estaAlertaHabilitadaParaRol_('ASPIRANTES_PENDIENTES_GESTION', sesion.rol)) {
    const aspirantes = leerHojaComoObjetos(HOJAS.ASPIRANTES)
      .filter(function(item) {
        return convertirBooleano(item.activo);
      });

    const pendientes = aspirantes.filter(function(item) {
      const estado = normalizarTexto(item.estadoSolicitud);
      return estado !== 'convertido' && estado !== 'rechazado';
    });

    if (pendientes.length > 0) {
      items.push({
        id: 'ASPIRANTES_PENDIENTES',
        tipo: 'warning',
        titulo: pendientes.length === 1
          ? '1 aspirante requiere gestión'
          : pendientes.length + ' aspirantes requieren gestión',
        mensaje: 'Hay solicitudes pendientes de revisión.',
        cantidad: pendientes.length,
        ruta: '/aspirantes',
        permiso: 'ASPIRANTES_CAMBIAR_ESTADO'
      });
      totalPendientes += pendientes.length;
    }
  }

  if (estaAlertaHabilitadaParaRol_('PAGOS_PENDIENTES_VALIDACION', sesion.rol)) {
    const pagosPendientes = leerHojaComoObjetos(HOJAS.PAGOS).filter(function(p) {
      return normalizarTexto(p.estadoPagoReportado || p.estado) === 'pendiente';
    });
    if (pagosPendientes.length) {
      items.push({ id:'PAGOS_PENDIENTES', tipo:'warning', titulo: pagosPendientes.length + ' pagos pendientes por validar', mensaje:'Tesorería debe revisar los comprobantes reportados.', cantidad:pagosPendientes.length, ruta:'/pagos', permiso:'PAGOS_VER_ESTADOS_CUENTA' });
      totalPendientes += pagosPendientes.length;
    }
  }

  const configuracionServicio = obtenerConfiguraciones();

  if (
    permisos.indexOf('SERVICIO_ANGELITOS_GESTIONAR') >= 0 &&
    estaAlertaHabilitadaParaRol_('ANGELITOS_PENDIENTES_GESTION', sesion.rol)
  ) {
    const pendientesAngelitos = leerHojaComoObjetos(HOJAS.ANGELITOS || 'Angelitos')
      .filter(function(item) {
        return convertirBooleano(item.activo) &&
          normalizarTexto(item.estadoInscripcion || 'Pendiente') === 'pendiente';
      });

    if (pendientesAngelitos.length) {
      items.push({
        id: 'ANGELITOS_PENDIENTES',
        tipo: 'warning',
        titulo: reemplazarVariablesNotificacionServicio_(
          configuracionServicio.campanaAngelitosTitulo || '{{cantidad}} inscripciones de Angelitos pendientes',
          { cantidad: pendientesAngelitos.length }
        ),
        mensaje: configuracionServicio.campanaAngelitosMensaje || 'Hay nuevas personas inscritas como Angelitos que requieren aprobación o rechazo.',
        cantidad: pendientesAngelitos.length,
        ruta: '/servicio/angelitos',
        permiso: 'SERVICIO_ANGELITOS_GESTIONAR'
      });
      totalPendientes += pendientesAngelitos.length;
    }
  }

  if (
    permisos.indexOf('SERVICIO_SERENATA_GESTIONAR') >= 0 &&
    estaAlertaHabilitadaParaRol_('SERENATA_PENDIENTES_GESTION', sesion.rol)
  ) {
    const pendientesSerenata = leerHojaComoObjetos(HOJAS.SERENATA || 'Serenata')
      .filter(function(item) {
        return convertirBooleano(item.activo) &&
          normalizarTexto(item.estadoInscripcion || 'Pendiente') === 'pendiente';
      });

    if (pendientesSerenata.length) {
      items.push({
        id: 'SERENATA_PENDIENTES',
        tipo: 'warning',
        titulo: reemplazarVariablesNotificacionServicio_(
          configuracionServicio.campanaSerenataTitulo || '{{cantidad}} inscripciones de Serenata pendientes',
          { cantidad: pendientesSerenata.length }
        ),
        mensaje: configuracionServicio.campanaSerenataMensaje || 'Hay nuevas personas inscritas para Serenata que requieren aprobación o rechazo.',
        cantidad: pendientesSerenata.length,
        ruta: '/servicio/serenata',
        permiso: 'SERVICIO_SERENATA_GESTIONAR'
      });
      totalPendientes += pendientesSerenata.length;
    }
  }

  // Entrega 3: notificaciones del flujo colaborativo de presentaciones.
  try {
    // obtenerNotificacionesTemas ya aplica destinatario y parametrización por tipo.
    const notificacionesTemas = obtenerNotificacionesTemas(token).filter(function(n) { return !n.leida; });
    if (notificacionesTemas.length) {
      const rutaCampana = normalizarTexto(sesion.rol).indexOf('audiovis') >= 0
        ? '/presentaciones'
        : '/mis-temas';
      items.push({
        id: 'PRESENTACIONES_PENDIENTES', tipo: 'warning',
        titulo: notificacionesTemas.length === 1 ? '1 novedad en tus temas' : notificacionesTemas.length + ' novedades en tus temas',
        mensaje: normalizarTexto(sesion.rol).indexOf('audiovis') >= 0
          ? 'Hay material nuevo o respuestas pendientes de revisión.'
          : 'Audiovisuales realizó cambios o dejó observaciones en tu material.',
        cantidad: notificacionesTemas.length,
        ruta: rutaCampana,
        permiso: ''
      });
      totalPendientes += notificacionesTemas.length;
    }
  } catch (ignoradoTemas) {
    console.error('Error consultando notificaciones de temas: ' + (ignoradoTemas && ignoradoTemas.message ? ignoradoTemas.message : ignoradoTemas));
  }

  // WhatsApp es un tipo específico de notificación y no todos los roles
  // tienen permiso para consultarlo. No debe bloquear la campana general.
  const alertasWhatsappPorId = {
    WHATSAPP_INSCRIPCION: 'WHATSAPP_INSCRIPCION_PENDIENTE',
    WHATSAPP_APROBACION: 'WHATSAPP_APROBACION_PENDIENTE',
    WHATSAPP_CANCELACION: 'WHATSAPP_CANCELACION_PENDIENTE',
    WHATSAPP_PAGO_RECHAZADO: 'WHATSAPP_PAGO_RECHAZADO_PENDIENTE'
  };
  const algunaWhatsappHabilitada = Object.keys(alertasWhatsappPorId).some(function(id) {
    return estaAlertaHabilitadaParaRol_(alertasWhatsappPorId[id], sesion.rol);
  });

  if (algunaWhatsappHabilitada) {
    try {
      const resumenWhatsapp = obtenerResumenNotificacionesWhatsappParaCampana(token);
      resumenWhatsapp.items.forEach(function(item) {
        const codigo = alertasWhatsappPorId[item.id];
        if (codigo && estaAlertaHabilitadaParaRol_(codigo, sesion.rol)) {
          items.push(item);
          totalPendientes += Number(item.cantidad || 0);
        }
      });
    } catch (ignoradoWhatsapp) {}
  }

  return {
    total: items.length,
    totalPendientes: totalPendientes,
    items: items,
    consultadoPor: sesion.usuario || '',
    fechaConsulta: new Date()
  };
}

/**
 * Prueba local. Reemplazar el token antes de ejecutar.
 */
function probarNotificaciones() {
  const token = 'PEGAR_TOKEN_VALIDO';

  console.log(
    JSON.stringify(
      obtenerNotificaciones(token),
      null,
      2
    )
  );
}


function reemplazarVariablesNotificacionServicio_(plantilla, variables) {
  return String(plantilla || '').replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    function(_, clave) {
      return variables[clave] === undefined || variables[clave] === null
        ? ''
        : String(variables[clave]);
    }
  );
}
