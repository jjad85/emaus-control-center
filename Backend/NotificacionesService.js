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

  if (
    permisos.includes('ASPIRANTES_CAMBIAR_ESTADO') ||
    permisos.includes('ASPIRANTES_CAMBIAR_ESTADO')
  ) {
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

  if (permisos.includes('PAGOS_VER_ESTADOS_CUENTA')) {
    const pagosPendientes = leerHojaComoObjetos(HOJAS.PAGOS).filter(function(p) {
      return normalizarTexto(p.estadoPagoReportado || p.estado) === 'pendiente';
    });
    if (pagosPendientes.length) {
      items.push({ id:'PAGOS_PENDIENTES', tipo:'warning', titulo: pagosPendientes.length + ' pagos pendientes por validar', mensaje:'Tesorería debe revisar los comprobantes reportados.', cantidad:pagosPendientes.length, ruta:'/pagos', permiso:'PAGOS_VER_ESTADOS_CUENTA' });
      totalPendientes += pagosPendientes.length;
    }
  }

  // Entrega 3: notificaciones del flujo colaborativo de presentaciones.
  try {
    const notificacionesTemas = obtenerNotificacionesTemas(token).filter(function(n) { return !n.leida; });
    if (notificacionesTemas.length) {
      items.push({
        id: 'PRESENTACIONES_PENDIENTES', tipo: 'warning',
        titulo: notificacionesTemas.length === 1 ? '1 novedad en presentaciones' : notificacionesTemas.length + ' novedades en presentaciones',
        mensaje: 'Hay comentarios, revisiones o aprobaciones pendientes.',
        cantidad: notificacionesTemas.length,
        ruta: normalizarTexto(sesion.rol).indexOf('audiovis') >= 0 || normalizarTexto(sesion.rol).indexOf('admin') >= 0 ? '/presentaciones' : '/mis-temas',
        permiso: ''
      });
      totalPendientes += notificacionesTemas.length;
    }
  } catch (ignoradoTemas) {}

  // WhatsApp es un tipo específico de notificación y no todos los roles
  // tienen permiso para consultarlo. No debe bloquear la campana general.
  const puedeConsultarWhatsapp =
    permisos.includes('ASPIRANTES_NOTIFICAR_PREINSCRIPCION') ||
    permisos.includes('NOTIFICAR_CAMINANTE') ||
    permisos.includes('ASPIRANTES_CAMBIAR_ESTADO');

  if (puedeConsultarWhatsapp) {
    const resumenWhatsapp =
      obtenerResumenNotificacionesWhatsappParaCampana(token);

    resumenWhatsapp.items.forEach(function(item) {
      items.push(item);
    });

    totalPendientes += resumenWhatsapp.totalPendientes;
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
