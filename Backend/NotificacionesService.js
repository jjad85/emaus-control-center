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
    permisos.includes('CONVERTIR_ASPIRANTE') ||
    permisos.includes('ACTUALIZAR_ESTADO_ASPIRANTE')
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
        permiso: 'CONVERTIR_ASPIRANTE'
      });
      totalPendientes += pendientes.length;
    }
  }

  const resumenWhatsapp =
    obtenerResumenNotificacionesWhatsappParaCampana(token);

  resumenWhatsapp.items.forEach(function(item) {
    items.push(item);
  });

  totalPendientes += resumenWhatsapp.totalPendientes;

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
