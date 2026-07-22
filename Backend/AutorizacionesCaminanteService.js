/** Gestión de enlaces públicos para autorizaciones de caminantes. */
const HOJA_AUTORIZACIONES_CAMINANTE = 'AutorizacionesCaminantes';
const ESTADO_AUTORIZACION_PENDIENTE = 'Pendiente';
const ESTADO_AUTORIZACION_ACEPTADA = 'Aceptada';
const ESTADO_AUTORIZACION_RECHAZADA = 'Rechazada';

function enviarAutorizacionesCaminante(tokenSesion, caminanteId) {
  const sesion = validarPermiso(tokenSesion, 'ENVIAR_AUTORIZACIONES_CAMINANTE');
  const caminante = obtenerCaminantePorId(caminanteId);
  const estadoDatos = normalizarTexto(caminante.autorizaTratamientoDatos);
  const estadoFotos = normalizarTexto(caminante.autorizaFotografias);

  if (estadoDatos === 'aceptada' && estadoFotos === 'aceptada') {
    throw crearErrorAplicacion('AUTORIZACIONES_YA_ACEPTADAS', 'El caminante ya aceptó ambas autorizaciones.');
  }

  const configuracion = obtenerConfiguraciones();
  const minutos = Math.max(1, Number(configuracion.minutosVigenciaEnlaceAutorizaciones || 120));
  const baseUrl = String(configuracion.urlBaseAplicacion || '').trim().replace(/\/$/, '');
  if (!baseUrl) {
    throw crearErrorAplicacion('URL_APLICACION_NO_CONFIGURADA', 'Configure el parámetro urlBaseAplicacion antes de enviar autorizaciones.');
  }

  invalidarEnlacesAutorizacionCaminante_(caminanteId);

  const tokenPlano = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + minutos * 60000);
  const id = Utilities.getUuid();
  const enlace = baseUrl + '/autorizaciones?token=' + encodeURIComponent(tokenPlano);

  agregarRegistroAutorizacionCaminante_({
    id: id,
    caminanteId: String(caminanteId),
    aspiranteId: String(caminante.aspiranteId || caminante.idAspirante || ''),
    tokenHash: hashTokenAutorizacion_(tokenPlano),
    estado: 'Activo',
    resultado: 'Pendiente',
    fechaGeneracion: ahora,
    fechaExpiracion: expira,
    generadoPor: sesion.usuario || '',
    fechaEnvio: ahora,
    fechaRespuesta: '',
    activo: 'Sí'
  });

  const notificacion = crearNotificacionWhatsappPendiente({
    tipo: 'AUTORIZACIONES',
    entidad: 'AutorizacionesCaminante',
    entidadId: id,
    nombre: caminante.nombreCompleto || caminante.nombre || '',
    telefono: caminante.celular || caminante.telefono || '',
    motivo: JSON.stringify({ link: enlace, minutos: minutos })
  });

  const whatsapp = prepararNotificacionWhatsapp(tokenSesion, notificacion.id);

  registrarAuditoria({
    usuario: sesion.usuario,
    nombre: sesion.nombre,
    accion: 'ENVIAR_AUTORIZACIONES_CAMINANTE',
    entidad: 'Caminantes',
    idRegistro: caminanteId,
    detalle: JSON.stringify({ autorizacionId: id, fechaExpiracion: expira })
  });

  return { id: id, fechaExpiracion: expira, minutosVigencia: minutos, whatsapp: whatsapp };
}

function consultarAutorizacionesCaminantePublico(tokenPlano) {
  const registro = obtenerRegistroAutorizacionPorToken_(tokenPlano);
  validarEnlaceAutorizacion_(registro);
  const caminante = obtenerCaminantePorId(registro.caminanteId);
  const configuracion = obtenerConfiguraciones();

  return {
    nombre: caminante.nombreCompleto || caminante.nombre || '',
    fechaExpiracion: registro.fechaExpiracion,
    autorizacionDatosTitulo: configuracion.portalAutorizacionDatosTitulo || 'Autorización para el tratamiento de datos personales',
    autorizacionDatosTextoHtml: configuracion.portalAutorizacionDatosTextoHtml || '',
    autorizacionFotosTitulo: configuracion.portalAutorizacionFotosTitulo || 'Autorización de fotografías y material audiovisual',
    autorizacionFotosTextoHtml: configuracion.portalAutorizacionFotosTextoHtml || ''
  };
}

function responderAutorizacionesCaminantePublico(tokenPlano, decision) {
  const registro = obtenerRegistroAutorizacionPorToken_(tokenPlano);
  validarEnlaceAutorizacion_(registro);
  const decisionNormalizada = normalizarTexto(decision);
  if (decisionNormalizada !== 'aceptar' && decisionNormalizada !== 'rechazar') {
    throw crearErrorAplicacion('DECISION_INVALIDA', 'Debe aceptar o rechazar las autorizaciones.');
  }

  const aceptada = decisionNormalizada === 'aceptar';
  const resultado = aceptada ? ESTADO_AUTORIZACION_ACEPTADA : ESTADO_AUTORIZACION_RECHAZADA;
  const ahora = new Date();
  const configuracion = obtenerConfiguraciones();
  const cambios = {
    autorizaTratamientoDatos: resultado,
    autorizaFotografias: resultado,
    versionAutorizacionDatos: configuracion.portalAutorizacionDatosVersion || '1.0',
    fechaAceptacionDatos: aceptada ? ahora : '',
    textoAutorizacionDatos: configuracion.portalAutorizacionDatosTextoHtml || '',
    versionAutorizacionFotografias: configuracion.portalAutorizacionFotosVersion || '1.0',
    fechaAceptacionFotografias: aceptada ? ahora : '',
    textoAutorizacionFotografias: configuracion.portalAutorizacionFotosTextoHtml || ''
  };

  actualizarRegistroSheet(HOJAS.CAMINANTES, registro.caminanteId, cambios, { usuario: 'PORTAL_PUBLICO' });
  actualizarAspiranteRelacionadoAutorizacion_(registro.caminanteId, cambios);
  actualizarRegistroAutorizacionCaminante_(registro.id, {
    estado: 'Respondido', resultado: resultado, fechaRespuesta: ahora, activo: 'No'
  });

  registrarAuditoria({
    usuario: 'PORTAL_PUBLICO', nombre: '', accion: 'RESPONDER_AUTORIZACIONES_CAMINANTE',
    entidad: 'Caminantes', idRegistro: registro.caminanteId,
    detalle: JSON.stringify({ autorizacionId: registro.id, resultado: resultado })
  });

  return { resultado: resultado, mensaje: aceptada ? 'Autorizaciones aceptadas correctamente.' : 'La decisión de rechazo fue registrada correctamente.' };
}

function actualizarAspiranteRelacionadoAutorizacion_(caminanteId, cambios) {
  const aspirante = leerHojaComoObjetos(HOJAS.ASPIRANTES).find(function(item) {
    return String(item.caminanteId || '') === String(caminanteId);
  });
  if (aspirante && aspirante.id) {
    actualizarRegistroSheet(HOJAS.ASPIRANTES, aspirante.id, cambios, { usuario: 'PORTAL_PUBLICO' });
  }
}

function validarEnlaceAutorizacion_(registro) {
  if (!registro || !convertirBooleano(registro.activo) || normalizarTexto(registro.estado) !== 'activo') {
    throw crearErrorAplicacion('ENLACE_AUTORIZACION_INVALIDO', 'El enlace no es válido o ya fue utilizado.');
  }
  if (new Date(registro.fechaExpiracion).getTime() <= Date.now()) {
    actualizarRegistroAutorizacionCaminante_(registro.id, { estado: 'Expirado', resultado: 'Expirada', activo: 'No' });
    throw crearErrorAplicacion('ENLACE_AUTORIZACION_EXPIRADO', 'El enlace de autorizaciones ya expiró.');
  }
}

function invalidarEnlacesAutorizacionCaminante_(caminanteId) {
  leerHojaComoObjetos(HOJA_AUTORIZACIONES_CAMINANTE).forEach(function(item) {
    if (String(item.caminanteId) === String(caminanteId) && convertirBooleano(item.activo)) {
      actualizarRegistroAutorizacionCaminante_(item.id, { estado: 'Invalidado', activo: 'No' });
    }
  });
}

function hashTokenAutorizacion_(token) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(token), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/, '');
}

function obtenerRegistroAutorizacionPorToken_(tokenPlano) {
  const hash = hashTokenAutorizacion_(String(tokenPlano || '').trim());
  return leerHojaComoObjetos(HOJA_AUTORIZACIONES_CAMINANTE).find(function(item) {
    return String(item.tokenHash || '') === hash;
  }) || null;
}

function agregarRegistroAutorizacionCaminante_(registro) {
  const hoja = obtenerHoja(HOJA_AUTORIZACIONES_CAMINANTE);
  const encabezados = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  hoja.appendRow(encabezados.map(function(c) { return registro[String(c).trim()] === undefined ? '' : registro[String(c).trim()]; }));
}

function actualizarRegistroAutorizacionCaminante_(id, cambios) {
  const hoja = obtenerHoja(HOJA_AUTORIZACIONES_CAMINANTE);
  const datos = hoja.getDataRange().getValues();
  const encabezados = datos[0].map(function(v) { return String(v).trim(); });
  const indiceId = encabezados.indexOf('id');
  for (let i = 1; i < datos.length; i += 1) {
    if (String(datos[i][indiceId]) === String(id)) {
      Object.keys(cambios).forEach(function(clave) {
        const indice = encabezados.indexOf(clave);
        if (indice >= 0) hoja.getRange(i + 1, indice + 1).setValue(cambios[clave]);
      });
      return;
    }
  }
}
