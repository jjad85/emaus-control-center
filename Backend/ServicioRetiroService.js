/**
 * ============================================================
 * ADMINISTRACIÓN SERVICIO AL RETIRO
 * ============================================================
 * Gestión interna de Angelitos y Serenata.
 */

function obtenerConfiguracionModuloServicio_(tipo) {
  const normalizado = normalizarPermiso(tipo);

  if (normalizado === 'ANGELITOS') {
    return {
      tipo: 'ANGELITOS',
      hoja: 'Angelitos',
      entidad: 'Angelitos',
      permisoVer: 'SERVICIO_ANGELITOS_VER',
      permisoGestionar: 'SERVICIO_ANGELITOS_GESTIONAR',
      permisoNotificar: 'SERVICIO_ANGELITOS_NOTIFICAR',
      claveWhatsappActivo: 'angelitosWhatsappNotificacionActiva',
      claveMensajeAprobado: 'angelitosWhatsappMensajeAprobado',
      claveMensajeRechazado: 'angelitosWhatsappMensajeRechazado'
    };
  }

  if (normalizado === 'SERENATA') {
    return {
      tipo: 'SERENATA',
      hoja: 'Serenata',
      entidad: 'Serenata',
      permisoVer: 'SERVICIO_SERENATA_VER',
      permisoGestionar: 'SERVICIO_SERENATA_GESTIONAR',
      permisoNotificar: 'SERVICIO_SERENATA_NOTIFICAR',
      claveWhatsappActivo: 'serenataWhatsappNotificacionActiva',
      claveMensajeAprobado: 'serenataWhatsappMensajeAprobado',
      claveMensajeRechazado: 'serenataWhatsappMensajeRechazado'
    };
  }

  throw crearErrorAplicacion(
    'TIPO_SERVICIO_INVALIDO',
    'El tipo de servicio solicitado no es válido.'
  );
}

function opcionesCrudServicioRetiro_(usuario) {
  return {
    campoId: 'id',
    campoActivo: 'activo',
    campoFechaRegistro: 'fechaRegistro',
    campoFechaActualizacion: 'fechaActualizacion',
    campoActualizadoPor: 'actualizadoPor',
    usuario: usuario || '',
    valorActivo: 'Sí',
    valorInactivo: 'No'
  };
}

function obtenerAdministracionServicioRetiro(token, tipo) {
  const config = obtenerConfiguracionModuloServicio_(tipo);
  const sesion = validarPermiso(token, config.permisoVer);
  const configuracion = obtenerConfiguraciones();

  const items = listarRegistrosSheet(
    config.hoja,
    {},
    opcionesCrudServicioRetiro_('')
  )
    .filter(function(item) {
      return item.activo === undefined || convertirBooleano(item.activo);
    })
    .map(normalizarInscripcionServicioRetiro_)
    .sort(function(a, b) {
      return obtenerTiempoServicio_(a.fechaRegistro) - obtenerTiempoServicio_(b.fechaRegistro);
    });

  return {
    tipo: config.tipo,
    hojaOrigen: config.hoja,
    items: items,
    indicadores: {
      total: items.length,
      pendientes: items.filter(function(x){ return normalizarTexto(x.estadoInscripcion || 'Pendiente') === 'pendiente'; }).length,
      aprobados: items.filter(function(x){ return normalizarTexto(x.estadoInscripcion) === 'aprobado'; }).length,
      rechazados: items.filter(function(x){ return normalizarTexto(x.estadoInscripcion) === 'rechazado'; }).length
    },
    transporte: {
      carro: items.filter(function(x){ return normalizarTexto(x.tipoTransporte) === 'carro'; }).length,
      moto: items.filter(function(x){ return normalizarTexto(x.tipoTransporte) === 'moto'; }).length,
      sinVehiculo: items.filter(function(x){ return normalizarTexto(x.tipoTransporte) === 'sin vehiculo'; }).length,
      ofrecenCupos: items.filter(function(x){ return x.ofreceTransporte; }).length,
      cuposTotales: items.reduce(function(total, x){
        return total + (x.ofreceTransporte ? Number(x.cuposDisponibles || 0) : 0);
      }, 0)
    },
    whatsappActivo: convertirBooleano(configuracion[config.claveWhatsappActivo]),
    puedeGestionar: tienePermisoSesion(token, config.permisoGestionar),
    puedeNotificar: tienePermisoSesion(token, config.permisoNotificar),
    consultadoPor: sesion.usuario || ''
  };
}

function resolverInscripcionServicioRetiro(token, tipo, id, estado, observacionesGestion) {
  const config = obtenerConfiguracionModuloServicio_(tipo);
  const sesion = validarPermiso(token, config.permisoGestionar);
  const estadoNormalizado = normalizarTexto(estado);

  if (estadoNormalizado !== 'aprobado' && estadoNormalizado !== 'rechazado') {
    throw crearErrorAplicacion(
      'ESTADO_SERVICIO_INVALIDO',
      'La decisión debe ser Aprobado o Rechazado.'
    );
  }

  const observaciones = String(observacionesGestion || '').trim();
  if (estadoNormalizado === 'rechazado' && !observaciones) {
    throw crearErrorAplicacion(
      'MOTIVO_RECHAZO_REQUERIDO',
      'Debes indicar el motivo del rechazo.'
    );
  }

  const actual = leerRegistroPorIdSheet(
    config.hoja,
    id,
    opcionesCrudServicioRetiro_(sesion.usuario)
  );

  if (!actual) {
    throw crearErrorAplicacion('INSCRIPCION_NO_EXISTE', 'No encontramos la inscripción seleccionada.');
  }

  const estadoFinal = estadoNormalizado === 'aprobado' ? 'Aprobado' : 'Rechazado';
  const actualizado = actualizarRegistroSheet(
    config.hoja,
    id,
    {
      estadoInscripcion: estadoFinal,
      observacionesGestion: observaciones,
      fechaDecision: new Date(),
      decididoPor: sesion.usuario || '',
      fechaActualizacion: new Date(),
      actualizadoPor: sesion.usuario || ''
    },
    opcionesCrudServicioRetiro_(sesion.usuario)
  );

  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre,
    accion: estadoFinal === 'Aprobado' ? 'APROBAR_INSCRIPCION_SERVICIO' : 'RECHAZAR_INSCRIPCION_SERVICIO',
    entidad: config.entidad,
    idRegistro: id,
    detalle: JSON.stringify({ estado: estadoFinal, observaciones: observaciones })
  });

  const whatsapp = prepararWhatsappDecisionServicio_(
    token,
    config,
    actualizado,
    estadoFinal,
    observaciones
  );

  return {
    registro: normalizarInscripcionServicioRetiro_(actualizado),
    whatsapp: whatsapp
  };
}

function prepararWhatsappDecisionServicio_(token, config, registro, estado, motivo) {
  const configuracion = obtenerConfiguraciones();
  const activo = convertirBooleano(configuracion[config.claveWhatsappActivo]);

  if (!activo) {
    return { activo: false, razon: 'DESHABILITADO_POR_CONFIGURACION' };
  }

  if (!tienePermisoSesion(token, config.permisoNotificar)) {
    return { activo: false, razon: 'SIN_PERMISO_NOTIFICAR' };
  }

  const plantilla = estado === 'Aprobado'
    ? configuracion[config.claveMensajeAprobado]
    : configuracion[config.claveMensajeRechazado];

  const mensajePredeterminado = estado === 'Aprobado'
    ? 'Hola {{nombre}} 👋\n\nQueremos contarte que tu inscripción para apoyar el Retiro de Emaús fue aprobada. Muy pronto el equipo organizador se pondrá en contacto contigo con las indicaciones necesarias.\n\n¡Gracias por servir! 🙏'
    : 'Hola {{nombre}}.\n\nLuego de revisar tu inscripción para apoyar el Retiro de Emaús, en esta oportunidad no podremos contar con tu participación.\n\n{{motivo}}\n\nGracias por tu disposición para servir.';

  const mensaje = reemplazarVariablesServicio_(
    plantilla || mensajePredeterminado,
    {
      nombre: registro.nombreCompleto || '',
      motivo: motivo || '',
      tipoRetiro: configuracion.tipoRetiro || '',
      anioRetiro: configuracion.anioRetiro || '',
      servicio: config.tipo === 'ANGELITOS' ? 'Angelitos' : 'Serenata'
    }
  );

  const telefono = normalizarTelefonoServicio_(
    registro.celular,
    configuracion.whatsappCodigoPais || '57'
  );

  if (!telefono) {
    return { activo: false, razon: 'TELEFONO_INVALIDO' };
  }

  return {
    activo: true,
    telefono: telefono,
    mensaje: mensaje,
    url: 'https://wa.me/' + telefono + '?text=' + encodeURIComponent(mensaje)
  };
}

function reemplazarVariablesServicio_(plantilla, variables) {
  return String(plantilla || '').replace(
    /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
    function(_, clave) {
      return variables[clave] === undefined || variables[clave] === null
        ? ''
        : String(variables[clave]);
    }
  );
}

function normalizarTelefonoServicio_(telefono, codigoPais) {
  let numero = String(telefono || '').replace(/\D/g, '');
  const codigo = String(codigoPais || '57').replace(/\D/g, '') || '57';
  if (numero.length === 10) numero = codigo + numero;
  if (numero.length < 11 || numero.length > 15) return '';
  return numero;
}

function normalizarInscripcionServicioRetiro_(item) {
  const salida = Object.assign({}, item);

  salida.estadoInscripcion =
    String(item.estadoInscripcion || 'Pendiente').trim() || 'Pendiente';

  const tipoTransporte = String(item.tipoTransporte || '').trim();
  const vaEnVehiculo = convertirBooleano(item.vaEnVehiculo);
  salida.tipoTransporte =
    tipoTransporte ||
    (vaEnVehiculo ? 'Vehículo' : 'Sin vehículo');

  salida.deseaLlevarAlguien =
    convertirBooleano(item.deseaLlevarAlguien)
      ? 'Sí'
      : 'No';

  salida.cuposDisponibles =
    Math.max(0, Number(item.cuposDisponibles || 0) || 0);

  salida.ofreceTransporte =
    salida.deseaLlevarAlguien === 'Sí' &&
    salida.cuposDisponibles > 0;

  salida.lugarSalida = String(item.lugarSalida || '').trim();
  salida.horaSalida = String(item.horaSalida || '').trim();

  salida.fechaRegistro = normalizarFechaServicio_(item.fechaRegistro);
  salida.fechaActualizacion = normalizarFechaServicio_(item.fechaActualizacion);
  salida.fechaDecision = normalizarFechaServicio_(item.fechaDecision);

  return salida;
}

function normalizarFechaServicio_(valor) {
  if (!valor) return '';
  if (Object.prototype.toString.call(valor) === '[object Date]') {
    if (isNaN(valor.getTime())) return '';
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  }
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor || '');
  return Utilities.formatDate(fecha, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function obtenerTiempoServicio_(valor) {
  const tiempo = new Date(valor || 0).getTime();
  return isNaN(tiempo) ? 0 : tiempo;
}
