/**
 * ENTREGA 2 - GESTIÓN DE CANCIONES Y VIDEOS POR AUDIOVISUALES
 * Amplía la bandeja de Presentaciones sin reemplazar su flujo actual.
 */

function obtenerGestionRecursosAudiovisuales(token) {
  const sesion = validarPermiso(token, 'GESTIONAR_PRESENTACIONES');

  const temas = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(''))
    .map(convertirTema)
    .filter(function(tema) {
      return tema.activo && (
        normalizarSiNoPendienteTema_(tema.requiereMusica) === 'Sí' ||
        tema.usaVideo === true
      );
    });

  ordenarTemasColaboracion_(temas);

  const items = [];
  temas.forEach(function(tema) {
    if (normalizarSiNoPendienteTema_(tema.requiereMusica) === 'Sí') {
      items.push(construirRecursoAudiovisual_(tema, 'CANCION'));
    }
    if (tema.usaVideo === true) {
      items.push(construirRecursoAudiovisual_(tema, 'VIDEO'));
    }
  });

  return {
    items: items,
    indicadores: {
      total: items.length,
      pendientes: items.filter(function(x) { return normalizarTexto(x.estado).indexOf('pendiente') >= 0; }).length,
      enPreparacion: items.filter(function(x) { return normalizarTexto(x.estado) === 'en preparacion'; }).length,
      requierenAjustes: items.filter(function(x) { return normalizarTexto(x.estado).indexOf('ajuste') >= 0; }).length,
      aprobados: items.filter(function(x) { return normalizarTexto(x.estado) === 'aprobado'; }).length
    }
  };
}

function cambiarEstadoRecursoAudiovisual(token, temaId, tipo, estado, observaciones, archivoDefinitivo) {
  const sesion = validarPermiso(token, 'GESTIONAR_PRESENTACIONES');
  const tema = obtenerTemaPorIdColaboracion_(temaId);
  const tipoNormalizado = String(tipo || '').trim().toUpperCase();
  const estadoNormalizado = normalizarEstadoRecursoAudiovisual_(estado);
  const texto = String(observaciones || '').trim();

  if (tipoNormalizado !== 'CANCION' && tipoNormalizado !== 'VIDEO') {
    throw crearErrorAplicacion('TIPO_RECURSO_INVALIDO', 'El recurso debe ser canción o video.');
  }
  if (estadoNormalizado === 'Requiere ajustes' && !texto) {
    throw crearErrorAplicacion('OBSERVACION_REQUERIDA', 'Debe indicar los ajustes solicitados.');
  }

  validarRecursoActivoAudiovisual_(tema, tipoNormalizado);

  const cambios = {};
  const prefijo = tipoNormalizado === 'CANCION' ? 'cancion' : 'video';
  cambios[prefijo + 'Estado'] = estadoNormalizado;
  cambios[prefijo + 'ObservacionesAudiovisuales'] = texto;
  cambios[prefijo + 'AprobadaPor'] = estadoNormalizado === 'Aprobado' ? (sesion.nombre || sesion.usuario || '') : '';
  cambios[prefijo + 'FechaAprobacion'] = estadoNormalizado === 'Aprobado' ? new Date() : '';

  if (archivoDefinitivo && archivoDefinitivo.base64) {
    const archivo = guardarArchivoDefinitivoRecursoAudiovisual_(tema, tipoNormalizado, archivoDefinitivo, sesion);
    cambios[prefijo + 'ArchivoDefinitivoId'] = archivo.id;
    cambios[prefijo + 'ArchivoDefinitivoNombre'] = archivo.nombre;
    cambios[prefijo + 'ArchivoDefinitivoUrl'] = archivo.url;
  }

  cambios.fechaActualizacion = new Date();
  cambios.actualizadoPor = sesion.usuario || '';
  actualizarRegistroSheet(HOJAS.TEMAS, tema.id, cambios, opcionesCrudTemas(sesion.usuario));

  crearNotificacionTemaServidor_(tema, {
    tipo: tipoNormalizado + '_' + estadoNormalizado.toUpperCase().replace(/\s+/g, '_'),
    titulo: tituloNotificacionRecursoAudiovisual_(tipoNormalizado, estadoNormalizado),
    mensaje: mensajeNotificacionRecursoAudiovisual_(tema, tipoNormalizado, estadoNormalizado),
    ruta: '/mis-temas',
    versionId: ''
  }, sesion.usuario);

  auditarTema_(sesion, 'CAMBIAR_ESTADO_RECURSO_AUDIOVISUAL', tema.id, {
    tipo: tipoNormalizado,
    estado: estadoNormalizado,
    observaciones: texto,
    archivoDefinitivo: cambios[prefijo + 'ArchivoDefinitivoNombre'] || ''
  });

  registrarHistorialRecursoTema_({
    temaId: tema.id,
    temaNombre: tema.nombre,
    tipoRecurso: tipoNormalizado,
    estadoAnterior: tipoNormalizado === 'CANCION' ? (tema.cancionEstado || 'Pendiente de gestión') : (tema.videoEstado || 'Pendiente de gestión'),
    estadoNuevo: estadoNormalizado,
    observaciones: texto,
    archivoNombre: cambios[prefijo + 'ArchivoDefinitivoNombre'] || '',
    usuario: sesion.usuario || '',
    nombreUsuario: sesion.nombre || '',
    detalle: { origen: tipoNormalizado === 'CANCION' ? tema.cancionTipo : tema.videoTipo }
  });

  return obtenerGestionRecursosAudiovisuales(token);
}

function construirRecursoAudiovisual_(tema, tipo) {
  const esCancion = tipo === 'CANCION';
  const estandar = esCancion ? tema.usaCancionEstandar : tema.usaVideoEstandar;
  const documentoId = esCancion ? tema.cancionDocumentoId : tema.videoDocumentoId;
  const documentoNombre = esCancion ? tema.cancionDocumentoNombre : tema.videoDocumentoNombre;
  return {
    id: tipo + '_' + tema.id,
    temaId: tema.id,
    temaNombre: tema.nombre,
    servidorNombre: tema.servidorNombre || 'Sin asignar',
    diaDelTema: tema.diaDelTema || '',
    horaPropuesta: tema.horaPropuesta || '',
    tipo: tipo,
    origen: estandar ? 'ESTANDAR' : 'PERSONALIZADO',
    nombre: estandar ? documentoNombre : (esCancion ? tema.cancionNombre : tema.videoNombre),
    autorFuente: esCancion ? tema.cancionAutor : tema.videoAutorFuente,
    enlaceReferencia: estandar ? obtenerUrlDocumentoEstandarAudiovisual_(documentoId) : (esCancion ? tema.cancionEnlace : tema.videoEnlace),
    documentoEstandarId: documentoId || '',
    documentoEstandarNombre: documentoNombre || '',
    observacionesResponsable: esCancion ? tema.cancionObservaciones : tema.videoObservaciones,
    observacionesAudiovisuales: esCancion ? tema.cancionObservacionesAudiovisuales : tema.videoObservacionesAudiovisuales,
    estado: (esCancion ? tema.cancionEstado : tema.videoEstado) || 'Pendiente de gestión',
    aprobadoPor: esCancion ? tema.cancionAprobadaPor : tema.videoAprobadaPor,
    fechaAprobacion: esCancion ? tema.cancionFechaAprobacion : tema.videoFechaAprobacion,
    archivoDefinitivoId: esCancion ? tema.cancionArchivoDefinitivoId : tema.videoArchivoDefinitivoId,
    archivoDefinitivoNombre: esCancion ? tema.cancionArchivoDefinitivoNombre : tema.videoArchivoDefinitivoNombre,
    archivoDefinitivoUrl: esCancion ? tema.cancionArchivoDefinitivoUrl : tema.videoArchivoDefinitivoUrl,
    videoCompleto: esCancion ? true : tema.videoCompleto,
    videoMinutoInicio: esCancion ? '' : tema.videoMinutoInicio,
    videoMinutoFin: esCancion ? '' : tema.videoMinutoFin,
    videoMomentoReproduccion: esCancion ? '' : tema.videoMomentoReproduccion,
    fechaActualizacion: tema.fechaActualizacion || ''
  };
}

function normalizarEstadoRecursoAudiovisual_(estado) {
  const valor = normalizarTexto(estado);
  const mapa = {
    'pendiente de gestion': 'Pendiente de gestión',
    'en preparacion': 'En preparación',
    'listo para validacion': 'Listo para validación',
    'requiere ajustes': 'Requiere ajustes',
    'aprobado': 'Aprobado'
  };
  if (!mapa[valor]) throw crearErrorAplicacion('ESTADO_RECURSO_INVALIDO', 'El estado seleccionado no es válido.');
  return mapa[valor];
}

function validarRecursoActivoAudiovisual_(tema, tipo) {
  if (tipo === 'CANCION' && normalizarSiNoPendienteTema_(tema.requiereMusica) !== 'Sí') {
    throw crearErrorAplicacion('CANCION_NO_ACTIVA', 'El tema no tiene una canción activa.');
  }
  if (tipo === 'VIDEO' && !tema.usaVideo) {
    throw crearErrorAplicacion('VIDEO_NO_ACTIVO', 'El tema no tiene un video activo.');
  }
}

function obtenerUrlDocumentoEstandarAudiovisual_(id) {
  if (!id) return '';
  try { return DriveApp.getFileById(String(id)).getUrl(); } catch (error) { return ''; }
}

function guardarArchivoDefinitivoRecursoAudiovisual_(tema, tipo, archivo, sesion) {
  validarArchivoDefinitivoRecursoAudiovisual_(tipo, archivo);
  const bytes = decodificarArchivoTema_(archivo);
  const carpetas = crearCarpetasTemaSiNoExisten_(tema, sesion);
  const nombreCarpeta = 'Archivos Finales';
  const it = carpetas.raiz.getFoldersByName(nombreCarpeta);
  const carpeta = it.hasNext() ? it.next() : carpetas.raiz.createFolder(nombreCarpeta);
  const nombre = limpiarNombreArchivoTema_(tipo + '_' + tema.id + '_' + archivo.nombre);
  const file = carpeta.createFile(Utilities.newBlob(bytes, archivo.tipo, nombre));
  return { id: file.getId(), nombre: archivo.nombre, url: file.getUrl() };
}

function validarArchivoDefinitivoRecursoAudiovisual_(tipo, archivo) {
  const tiposCancion = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a'];
  const tiposVideo = ['video/mp4', 'video/webm', 'video/quicktime'];
  validarArchivoTema_(archivo, tipo === 'CANCION' ? tiposCancion : tiposVideo, 'ARCHIVO_RECURSO_INVALIDO');
}

function tituloNotificacionRecursoAudiovisual_(tipo, estado) {
  const recurso = tipo === 'CANCION' ? 'La canción' : 'El video';
  if (estado === 'Aprobado') return recurso + ' fue aprobado por Audiovisuales';
  if (estado === 'Requiere ajustes') return 'Audiovisuales solicitó ajustes al recurso';
  return recurso + ' cambió de estado';
}

function mensajeNotificacionRecursoAudiovisual_(tema, tipo, estado) {
  const recurso = tipo === 'CANCION' ? 'La canción' : 'El video';
  return recurso + ' del tema “' + tema.nombre + '” quedó en estado: ' + estado + '.';
}
