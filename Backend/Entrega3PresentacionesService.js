/**
 * ============================================================
 * ENTREGA 3 - FLUJO COLABORATIVO DE PRESENTACIONES
 * ============================================================
 * Comentarios, revisión, aprobación, solicitud de ajustes y
 * notificaciones para Servidor, Audiovisuales y Administrador.
 */

const HOJA_TEMA_COMENTARIOS = 'TemaComentarios';
const HOJA_TEMA_NOTIFICACIONES = 'TemaNotificaciones';
const PERMISO_GESTIONAR_PRESENTACIONES = 'GESTIONAR_PRESENTACIONES';

function obtenerRevisionPresentaciones(token) {
  const sesion = obtenerSesion(token);
  validarRolAudiovisuales_(sesion);

  const temas = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(''))
    .map(convertirTema)
    .filter(function(t) { return t.activo && normalizarSiNoPendienteTema_(t.requierePresentacion) === 'Sí'; });

  ordenarTemasColaboracion_(temas);

  return {
    items: temas.map(function(tema) {
      const versiones = listarVersionesTemaParaUsuario_(tema.id);
      const versionActual = versiones.find(function(v) { return v.esVersionActual; }) || versiones[0] || null;
      return Object.assign({}, tema, {
        versiones: versiones,
        versionActual: versionActual,
        comentarios: listarComentariosTema_(tema.id),
        comentariosPendientes: contarComentariosPendientes_(tema.id, 'Audiovisuales')
      });
    }),
    indicadores: calcularIndicadoresRevision_(temas),
    usuario: sesion.usuario || ''
  };
}

function comentarPresentacion(token, temaId, versionId, comentario) {
  const sesion = obtenerSesion(token);
  const texto = String(comentario || '').trim();
  if (!texto) throw crearErrorAplicacion('COMENTARIO_REQUERIDO', 'Escriba un comentario.');

  const tema = obtenerTemaColaboracion_(sesion, temaId);
  const rolActor = obtenerRolActorTema_(sesion, tema);
  const version = obtenerVersionTema_(temaId, versionId);

  const creado = crearRegistroSheet(HOJA_TEMA_COMENTARIOS, {
    temaId: tema.id,
    versionId: version.id,
    numeroVersion: version.numeroVersion,
    usuario: sesion.usuario || '',
    nombreUsuario: sesion.nombre || sesion.usuario || '',
    rol: rolActor,
    comentario: texto,
    tipo: 'Comentario',
    atendido: 'No',
    fechaRegistro: new Date(),
    fechaActualizacion: new Date(),
    actualizadoPor: sesion.usuario || ''
  }, opcionesCrudComentarioTema_(sesion.usuario));

  crearNotificacionesTema_(tema, sesion, rolActor, {
    tipo: 'COMENTARIO_PRESENTACION',
    titulo: 'Nuevo comentario en una presentación',
    mensaje: (sesion.nombre || sesion.usuario || rolActor) + ' comentó la versión ' + version.numeroVersion + ' del tema “' + tema.nombre + '”.',
    ruta: rolActor === 'Servidor' ? '/presentaciones' : '/mis-temas',
    versionId: version.id
  });

  auditarTema_(sesion, 'COMENTAR_PRESENTACION', tema.id, { versionId: version.id, comentarioId: creado.id });
  return listarComentariosTema_(tema.id);
}

function revisarPresentacionAudiovisuales(token, temaId, versionId, decision, comentario) {
  const sesion = obtenerSesion(token);
  validarRolAudiovisuales_(sesion);
  const tema = obtenerTemaPorIdColaboracion_(temaId);
  const version = obtenerVersionTema_(temaId, versionId);
  const accion = normalizarTexto(decision);
  const texto = String(comentario || '').trim();

  if (accion !== 'aprobar' && accion !== 'solicitar ajustes') {
    throw crearErrorAplicacion('DECISION_INVALIDA', 'Seleccione aprobar o solicitar ajustes.');
  }
  if (accion === 'solicitar ajustes' && !texto) {
    throw crearErrorAplicacion('COMENTARIO_REQUERIDO', 'Debe indicar los ajustes solicitados.');
  }

  const aprobada = accion === 'aprobar';
  actualizarRegistroSheet(HOJA_TEMA_VERSIONES, version.id, {
    estadoVersion: aprobada ? 'Pendiente aprobación servidor' : 'Requiere ajustes',
    aprobadaAudiovisuales: aprobada ? 'Sí' : 'No',
    aprobadaConferencista: aprobada ? 'No' : 'No',
    fechaActualizacion: new Date(),
    actualizadoPor: sesion.usuario || ''
  }, opcionesCrudTemaVersion_(sesion.usuario));

  actualizarRegistroSheet(HOJAS.TEMAS, tema.id, {
    estadoPreparacion: aprobada ? 'Pendiente aprobación servidor' : 'Requiere ajustes',
    aprobacionAudiovisuales: aprobada ? 'Sí' : 'No',
    aprobacionConferencista: 'No',
    versionAprobadaId: '',
    fechaActualizacion: new Date(),
    actualizadoPor: sesion.usuario || ''
  }, opcionesCrudTemas(sesion.usuario));

  if (texto) registrarComentarioSistemaTema_(sesion, tema, version, texto, aprobada ? 'Aprobación audiovisuales' : 'Solicitud de ajustes', 'Audiovisuales');

  crearNotificacionTemaServidor_(tema, {
    tipo: aprobada ? 'APROBADA_AUDIOVISUALES' : 'AJUSTES_SOLICITADOS',
    titulo: aprobada ? 'Presentación aprobada por Audiovisuales' : 'Audiovisuales solicitó ajustes',
    mensaje: aprobada
      ? 'La versión ' + version.numeroVersion + ' del tema “' + tema.nombre + '” está lista para tu aprobación.'
      : 'La versión ' + version.numeroVersion + ' del tema “' + tema.nombre + '” requiere ajustes.',
    ruta: '/mis-temas',
    versionId: version.id
  }, sesion.usuario);

  auditarTema_(sesion, aprobada ? 'APROBAR_PRESENTACION_AUDIOVISUALES' : 'SOLICITAR_AJUSTES_PRESENTACION', tema.id, { versionId: version.id });
  return obtenerRevisionPresentaciones(token);
}

function responderRevisionServidor(token, temaId, versionId, decision, comentario) {
  const sesion = obtenerSesion(token);
  const tema = validarTemaPerteneceASesion_(sesion, temaId);
  const version = obtenerVersionTema_(temaId, versionId);
  const accion = normalizarTexto(decision);
  const texto = String(comentario || '').trim();

  if (accion !== 'aprobar' && accion !== 'solicitar ajustes') {
    throw crearErrorAplicacion('DECISION_INVALIDA', 'Seleccione aprobar o solicitar ajustes.');
  }
  if (accion === 'aprobar' && !version.aprobadaAudiovisuales) {
    throw crearErrorAplicacion('REVISION_AUDIOVISUAL_PENDIENTE', 'Audiovisuales todavía no ha aprobado esta versión.');
  }
  if (accion === 'solicitar ajustes' && !texto) {
    throw crearErrorAplicacion('COMENTARIO_REQUERIDO', 'Debe indicar los ajustes solicitados.');
  }

  const aprobada = accion === 'aprobar';
  actualizarRegistroSheet(HOJA_TEMA_VERSIONES, version.id, {
    estadoVersion: aprobada ? 'Aprobada final' : 'Requiere ajustes audiovisuales',
    aprobadaConferencista: aprobada ? 'Sí' : 'No',
    fechaActualizacion: new Date(),
    actualizadoPor: sesion.usuario || ''
  }, opcionesCrudTemaVersion_(sesion.usuario));

  actualizarRegistroSheet(HOJAS.TEMAS, tema.id, {
    estadoPreparacion: aprobada ? 'Tema configurado' : 'Requiere ajustes audiovisuales',
    aprobacionConferencista: aprobada ? 'Sí' : 'No',
    aprobacionAudiovisuales: aprobada ? 'Sí' : 'No',
    versionAprobadaId: aprobada ? version.id : '',
    fechaActualizacion: new Date(),
    actualizadoPor: sesion.usuario || ''
  }, opcionesCrudTemas(sesion.usuario));

  if (texto) registrarComentarioSistemaTema_(sesion, tema, version, texto, aprobada ? 'Aprobación servidor' : 'Solicitud de ajustes', 'Servidor');

  crearNotificacionTemaAudiovisuales_(tema, {
    tipo: aprobada ? 'APROBADA_SERVIDOR' : 'AJUSTES_AUDIOVISUALES_SOLICITADOS',
    titulo: aprobada ? 'El servidor aprobó la presentación' : 'El servidor solicitó ajustes',
    mensaje: aprobada
      ? 'La versión ' + version.numeroVersion + ' del tema “' + tema.nombre + '” quedó aprobada finalmente.'
      : 'El servidor solicitó ajustes sobre la versión ' + version.numeroVersion + ' del tema “' + tema.nombre + '”.',
    ruta: '/presentaciones', versionId: version.id
  }, sesion.usuario);

  auditarTema_(sesion, aprobada ? 'APROBAR_PRESENTACION_SERVIDOR' : 'SOLICITAR_AJUSTES_AUDIOVISUALES', tema.id, { versionId: version.id });
  return obtenerMiTemaAsignado(token);
}

function obtenerNotificacionesTemas(token) {
  const sesion = obtenerSesion(token);
  const rol = normalizarTexto(sesion.rol);
  return listarRegistrosSheet(HOJA_TEMA_NOTIFICACIONES, {}, opcionesCrudNotificacionTema_(''))
    .filter(function(n) {
      if (!convertirBooleano(
        n.activo === undefined || n.activo === '' ? 'Sí' : n.activo
      )) {
        return false;
      }

      // Prioridad estricta del destinatario:
      // 1. Usuario específico.
      // 2. Servidor específico.
      // 3. Rol.
      // Una notificación personal nunca debe heredarse por rol.
      if (String(n.usuarioDestino || '').trim()) {
        return normalizarTexto(n.usuarioDestino) ===
          normalizarTexto(sesion.usuario);
      }

      if (String(n.servidorIdDestino || '').trim()) {
        return String(n.servidorIdDestino) ===
          String(sesion.servidorId || '');
      }

      if (String(n.rolDestino || '').trim()) {
        return normalizarTexto(n.rolDestino) === rol;
      }

      return false;
    })
    .map(convertirNotificacionTema_)
    .sort(function(a, b) { return String(b.fechaRegistro).localeCompare(String(a.fechaRegistro)); });
}

function marcarNotificacionTemaLeida(token, id) {
  const sesion = obtenerSesion(token);
  const visibles = obtenerNotificacionesTemas(token);
  if (!visibles.some(function(n) { return String(n.id) === String(id); })) {
    throw crearErrorAplicacion('NOTIFICACION_NO_AUTORIZADA', 'No puede modificar esta notificación.');
  }
  actualizarRegistroSheet(HOJA_TEMA_NOTIFICACIONES, id, {
    leida: 'Sí', fechaLectura: new Date(), fechaActualizacion: new Date(), actualizadoPor: sesion.usuario || ''
  }, opcionesCrudNotificacionTema_(sesion.usuario));
  return obtenerNotificacionesTemas(token);
}

function listarComentariosTema_(temaId) {
  return listarRegistrosSheet(HOJA_TEMA_COMENTARIOS, {}, opcionesCrudComentarioTema_(''))
    .filter(function(c) { return String(c.temaId || '') === String(temaId); })
    .map(function(c) {
      return { id:c.id, temaId:c.temaId, versionId:c.versionId, numeroVersion:Number(c.numeroVersion||0), usuario:c.usuario||'', nombreUsuario:c.nombreUsuario||'', rol:c.rol||'', comentario:c.comentario||'', tipo:c.tipo||'Comentario', atendido:convertirBooleano(c.atendido), fechaRegistro:normalizarFechaTemaRespuesta_(c.fechaRegistro) };
    })
    .sort(function(a,b){ return String(b.fechaRegistro).localeCompare(String(a.fechaRegistro)); });
}

function obtenerTemaColaboracion_(sesion, temaId) {
  const permisos = obtenerPermisosPorRol(sesion.rol) || [];

  if (permisos.includes(PERMISO_GESTIONAR_PRESENTACIONES) || permisos.includes('PRESENTACIONES_TODO')) {
    return obtenerTemaPorIdColaboracion_(temaId);
  }

  return validarTemaPerteneceASesion_(sesion, temaId);
}
function obtenerTemaPorIdColaboracion_(temaId) { const t=convertirTema(leerRegistroPorIdSheet(HOJAS.TEMAS,temaId,opcionesCrudTemas(''))); if(!t.activo) throw crearErrorAplicacion('TEMA_INACTIVO','El tema no está activo.'); return t; }
function obtenerVersionTema_(temaId, versionId) { const v=listarVersionesTemaParaUsuario_(temaId).find(function(x){return String(x.id)===String(versionId);}); if(!v) throw crearErrorAplicacion('VERSION_NO_ENCONTRADA','No se encontró la versión indicada.'); return v; }
function validarRolAudiovisuales_(sesion) {
  const permisos = obtenerPermisosPorRol(sesion.rol) || [];

  if (!permisos.includes(PERMISO_GESTIONAR_PRESENTACIONES) && !permisos.includes('PRESENTACIONES_TODO')) {
    throw crearErrorAplicacion(
      'SIN_PERMISO_PRESENTACIONES',
      'No tiene permiso para gestionar las presentaciones de Audiovisuales.'
    );
  }
}
function obtenerRolActorTema_(sesion, tema) {
  const permisos = obtenerPermisosPorRol(sesion.rol) || [];

  if (permisos.includes(PERMISO_GESTIONAR_PRESENTACIONES) || permisos.includes('PRESENTACIONES_TODO')) {
    return 'Audiovisuales';
  }

  if (
    String(sesion.servidorId || '') ===
    String(tema.servidorId || '')
  ) {
    return 'Servidor';
  }

  return sesion.rol || 'Usuario';
}
function registrarComentarioSistemaTema_(sesion,tema,version,texto,tipo,rol){ return crearRegistroSheet(HOJA_TEMA_COMENTARIOS,{temaId:tema.id,versionId:version.id,numeroVersion:version.numeroVersion,usuario:sesion.usuario||'',nombreUsuario:sesion.nombre||sesion.usuario||'',rol:rol,comentario:texto,tipo:tipo,atendido:'No',fechaRegistro:new Date(),fechaActualizacion:new Date(),actualizadoPor:sesion.usuario||''},opcionesCrudComentarioTema_(sesion.usuario)); }
function contarComentariosPendientes_(temaId,rol){ return listarComentariosTema_(temaId).filter(function(c){return !c.atendido && normalizarTexto(c.rol)!==normalizarTexto(rol);}).length; }
function opcionesCrudComentarioTema_(u){return {campoId:'id',campoFechaRegistro:'fechaRegistro',campoFechaActualizacion:'fechaActualizacion',campoActualizadoPor:'actualizadoPor',usuario:u||''};}
function opcionesCrudNotificacionTema_(u){return {campoId:'id',campoActivo:'activo',campoFechaRegistro:'fechaRegistro',campoFechaActualizacion:'fechaActualizacion',campoActualizadoPor:'actualizadoPor',usuario:u||'',valorActivo:'Sí',valorInactivo:'No'};}
function convertirNotificacionTema_(n){return {id:n.id,tipo:n.tipo||'INFO',titulo:n.titulo||'',mensaje:n.mensaje||'',ruta:n.ruta||'',temaId:n.temaId||'',versionId:n.versionId||'',leida:convertirBooleano(n.leida),fechaRegistro:normalizarFechaTemaRespuesta_(n.fechaRegistro)};}
function crearNotificacionTema_(datos,usuario){return crearRegistroSheet(HOJA_TEMA_NOTIFICACIONES,Object.assign({usuarioDestino:'',servidorIdDestino:'',rolDestino:'',leida:'No',fechaLectura:'',activo:'Sí',fechaRegistro:new Date(),fechaActualizacion:new Date(),actualizadoPor:usuario||''},datos),opcionesCrudNotificacionTema_(usuario));}
function crearNotificacionTemaServidor_(tema,datos,usuario){return crearNotificacionTema_(Object.assign({temaId:tema.id,servidorIdDestino:tema.servidorId||''},datos),usuario);}
function crearNotificacionTemaAudiovisuales_(tema,datos,usuario){return crearNotificacionTema_(Object.assign({temaId:tema.id,rolDestino:'Audiovisuales'},datos),usuario);}
function crearNotificacionesTema_(tema,sesion,rolActor,datos){ if(rolActor==='Servidor') return crearNotificacionTemaAudiovisuales_(tema,datos,sesion.usuario); return crearNotificacionTemaServidor_(tema,datos,sesion.usuario); }
function ordenarTemasColaboracion_(items){ const d={viernes:1,sabado:2,domingo:3}; items.sort(function(a,b){const da=d[normalizarTexto(a.diaDelTema)]||9,db=d[normalizarTexto(b.diaDelTema)]||9;if(da!==db)return da-db;return String(a.horaPropuesta||'99:99').localeCompare(String(b.horaPropuesta||'99:99'))||String(a.nombre||'').localeCompare(String(b.nombre||''),'es');}); return items; }
function calcularIndicadoresRevision_(temas){ const estados=temas.map(function(t){return normalizarTexto(t.estadoPreparacion);}); return {total:temas.length,pendientesRevision:estados.filter(function(e){return e.indexOf('revision')>=0;}).length,requierenAjustes:estados.filter(function(e){return e.indexOf('ajuste')>=0;}).length,pendientesServidor:estados.filter(function(e){return e.indexOf('aprobacion servidor')>=0;}).length,configurados:estados.filter(function(e){return e==='tema configurado'||e==='aprobada final';}).length}; }
