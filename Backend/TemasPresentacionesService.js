/**
 * ============================================================
 * TEMAS PRESENTACIONES SERVICE - ENTREGA 2
 * ============================================================
 * Flujo del conferencista: consulta de tema asignado,
 * carga de presentaciones, música e historial de versiones.
 */

const HOJA_TEMA_VERSIONES = 'TemaVersiones';
const HOJA_TEMA_MUSICA = 'TemaMusica';
const HOJA_TEMA_ARCHIVOS = 'TemaArchivos';
const MAX_ARCHIVO_TEMA_BYTES = 15 * 1024 * 1024;
const TIPOS_PRESENTACION_TEMA = [
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/pdf'
];
const TIPOS_MUSICA_TEMA = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a'
];

function obtenerMiTemaAsignado(token) {
  const sesion = obtenerSesion(token);
  const servidorId = String(sesion.servidorId || '').trim();
  if (!servidorId) {
    throw crearErrorAplicacion('USUARIO_SIN_SERVIDOR', 'El usuario no está relacionado con un servidor.');
  }

  const temas = listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(''))
    .map(convertirTema)
    .filter(function(item) {
      return item.activo && String(item.servidorId || '').trim() === servidorId;
    });

  ordenarTemasColaboracion_(temas);
  const plantilla = obtenerUrlPlantillaTemas_();

  return {
    items: temas.map(function(tema) {
      tema.versiones = listarVersionesTemaParaUsuario_(tema.id);
      tema.musica = listarMusicaTemaParaUsuario_(tema.id);
      tema.versionActual = tema.versiones.find(function(v) { return v.esVersionActual; }) || null;
      tema.comentarios = listarComentariosTema_(tema.id);
      return tema;
    }),
    plantillaUrl: plantilla,
    servidorId: servidorId,
    usuario: sesion.usuario || ''
  };
}

function subirVersionTema(token, temaId, archivo, comentario) {
  const sesion = obtenerSesion(token);
  const temaInicial = validarTemaPerteneceASesion_(sesion, temaId);

  if (normalizarSiNoPendienteTema_(temaInicial.requierePresentacion) === 'No') {
    throw crearErrorAplicacion('TEMA_SIN_PRESENTACION', 'Este tema está marcado como que no requiere presentación.');
  }

  validarArchivoTema_(archivo, TIPOS_PRESENTACION_TEMA, 'PRESENTACION_INVALIDA');
  const bytes = decodificarArchivoTema_(archivo);
  const carpetas = crearCarpetasTemaSiNoExisten_(temaInicial, sesion);
  const extension = obtenerExtensionArchivoTema_(archivo.nombre, archivo.tipo);
  const nombreTemporal = limpiarNombreArchivoTema_(
    temaInicial.id + '_TEMP_' + new Date().getTime() + '_' + temaInicial.nombre
  ) + '.' + extension;

  // La operación pesada de Drive se ejecuta fuera del bloqueo de Sheets.
  // Así evitamos mantener el documento bloqueado durante la decodificación
  // y creación física del archivo.
  const file = carpetas.presentaciones.createFile(
    Utilities.newBlob(bytes, archivo.tipo, nombreTemporal)
  );

  let registroConfirmado = false;

  try {
    const resultado = ejecutarCrudConBloqueo(function() {
      const tema = validarTemaPerteneceASesion_(sesion, temaId);
      const numero = obtenerSiguienteNumeroVersionTema_(tema.id);
      const nombreDefinitivo = limpiarNombreArchivoTema_(
        tema.id + '_V' + numero + '_' + tema.nombre
      ) + '.' + extension;

      desmarcarVersionActualTema_(tema.id, sesion.usuario);

      const creado = crearRegistroSheet(HOJA_TEMA_VERSIONES, {
        temaId: tema.id,
        numeroVersion: numero,
        nombreArchivo: nombreDefinitivo,
        archivoDriveId: file.getId(),
        archivoDriveUrl: file.getUrl(),
        cargadoPorId: sesion.servidorId || '',
        cargadoPorNombre: sesion.nombre || tema.servidorNombre || '',
        origenCarga: 'Servidor',
        comentarioCambio: String(comentario || '').trim(),
        estadoVersion: 'Pendiente revisión audiovisual',
        aprobadaConferencista: 'No',
        aprobadaAudiovisuales: 'No',
        esVersionActual: 'Sí',
        fechaRegistro: new Date(),
        fechaActualizacion: new Date(),
        actualizadoPor: sesion.usuario || ''
      }, opcionesCrudTemaVersion_(sesion.usuario));

      actualizarRegistroSheet(HOJAS.TEMAS, tema.id, {
        requierePresentacion: 'Sí',
        estadoPreparacion: 'Pendiente revisión audiovisual',
        aprobacionConferencista: 'No',
        aprobacionAudiovisuales: 'No',
        versionAprobadaId: '',
        carpetaDriveId: carpetas.raiz.getId(),
        carpetaDriveUrl: carpetas.raiz.getUrl(),
        fechaActualizacion: new Date(),
        actualizadoPor: sesion.usuario || ''
      }, opcionesCrudTemas(sesion.usuario));

      return {
        versionId: creado.id,
        numeroVersion: numero,
        nombreDefinitivo: nombreDefinitivo
      };
    });

    registroConfirmado = true;

    // Renombrar y auditar no deben invalidar una versión que ya quedó registrada.
    try { file.setName(resultado.nombreDefinitivo); } catch (ignoradoNombre) {}
    try {
      crearNotificacionTemaAudiovisuales_(
        temaInicial,
        {
          tipo: 'NUEVA_VERSION_PRESENTACION',
          titulo:
            'Nueva presentación pendiente de revisión',
          mensaje:
            (
              sesion.nombre ||
              sesion.usuario ||
              'Un servidor'
            ) +
            ' cargó la versión ' +
            resultado.numeroVersion +
            ' del tema “' +
            temaInicial.nombre +
            '”.',
          ruta: '/presentaciones',
          versionId: resultado.versionId
        },
        sesion.usuario
      );
    } catch (errorNotificacion) {
      console.error(
        'No fue posible crear la notificación de la presentación:',
        errorNotificacion
      );

      throw crearErrorAplicacion(
        'NOTIFICACION_PRESENTACION_NO_CREADA',
        'La presentación fue guardada, pero no fue posible generar la notificación para Audiovisuales. Detalle: ' +
          (
            errorNotificacion.message ||
            errorNotificacion
          )
      );
    }
    try {
      auditarTema_(sesion, 'SUBIR_VERSION_PRESENTACION', temaId, {
        versionId: resultado.versionId,
        numeroVersion: resultado.numeroVersion
      });
    } catch (ignoradoAuditoria) {}

    return listarVersionesTemaParaUsuario_(temaId);
  } catch (error) {
    // Evita archivos huérfanos únicamente si Sheets no alcanzó a confirmar el registro.
    if (!registroConfirmado) {
      try { file.setTrashed(true); } catch (ignorado) {}
    }
    throw error;
  }
}

function actualizarPreferenciasMiTema(token, temaId, datos) {
  const sesion = obtenerSesion(token);
  const tema = validarTemaPerteneceASesion_(sesion, temaId);
  const cambios = {};
  if (datos && Object.prototype.hasOwnProperty.call(datos, 'requierePresentacion')) {
    cambios.requierePresentacion = normalizarSiNoPendienteTema_(datos.requierePresentacion);
  }
  if (datos && Object.prototype.hasOwnProperty.call(datos, 'requiereMusica')) {
    cambios.requiereMusica = normalizarSiNoPendienteTema_(datos.requiereMusica);
  }
  cambios.estadoPreparacion = calcularEstadoPreparacionConVersiones_(Object.assign({}, tema, cambios));
  cambios.fechaActualizacion = new Date();
  cambios.actualizadoPor = sesion.usuario || '';
  actualizarRegistroSheet(HOJAS.TEMAS, tema.id, cambios, opcionesCrudTemas(sesion.usuario));
  auditarTema_(sesion, 'ACTUALIZAR_PREFERENCIAS_TEMA', tema.id, cambios);
  return obtenerMiTemaAsignado(token);
}

function subirMusicaTema(token, temaId, archivo, observaciones) {
  const sesion = obtenerSesion(token);
  return ejecutarCrudConBloqueo(function() {
    const tema = validarTemaPerteneceASesion_(sesion, temaId);
    validarArchivoTema_(archivo, TIPOS_MUSICA_TEMA, 'MUSICA_INVALIDA');
    const bytes = decodificarArchivoTema_(archivo);
    const carpetas = crearCarpetasTemaSiNoExisten_(tema, sesion);
    const nombre = limpiarNombreArchivoTema_(tema.id + '_' + archivo.nombre);
    const file = carpetas.musica.createFile(Utilities.newBlob(bytes, archivo.tipo, nombre));
    const creado = crearRegistroSheet(HOJA_TEMA_MUSICA, {
      temaId: tema.id,
      nombreCancion: archivo.nombre,
      autor: '', plataforma: 'Archivo', url: '',
      archivoDriveId: file.getId(), archivoDriveUrl: file.getUrl(),
      observaciones: String(observaciones || '').trim(), activo: 'Sí',
      fechaRegistro: new Date(), fechaActualizacion: new Date(), actualizadoPor: sesion.usuario || ''
    }, { campoId:'id', campoActivo:'activo', campoFechaRegistro:'fechaRegistro', campoFechaActualizacion:'fechaActualizacion', campoActualizadoPor:'actualizadoPor', usuario:sesion.usuario || '', valorActivo:'Sí', valorInactivo:'No' });
    actualizarRegistroSheet(HOJAS.TEMAS, tema.id, {
      requiereMusica:'Sí', carpetaDriveId:carpetas.raiz.getId(), carpetaDriveUrl:carpetas.raiz.getUrl(),
      fechaActualizacion:new Date(), actualizadoPor:sesion.usuario || ''
    }, opcionesCrudTemas(sesion.usuario));
    auditarTema_(sesion, 'SUBIR_MUSICA_TEMA', tema.id, { archivoId: creado.id });
    return listarMusicaTemaParaUsuario_(tema.id);
  });
}

function validarTemaPerteneceASesion_(sesion, temaId) {
  const temaCrudo = leerRegistroPorIdSheet(HOJAS.TEMAS, temaId, opcionesCrudTemas(''));
  const tema = convertirTema(temaCrudo);
  if (!tema.activo) throw crearErrorAplicacion('TEMA_INACTIVO', 'El tema no está activo.');
  if (String(tema.servidorId || '').trim() !== String(sesion.servidorId || '').trim()) {
    throw crearErrorAplicacion('TEMA_NO_AUTORIZADO', 'No tiene autorización para gestionar este tema.');
  }
  return tema;
}

function listarVersionesTemaParaUsuario_(temaId) {
  return listarRegistrosSheet(HOJA_TEMA_VERSIONES, {}, opcionesCrudTemaVersion_(''))
    .filter(function(v) { return String(v.temaId || '') === String(temaId); })
    .map(function(v) {
      return {
        id:v.id, temaId:v.temaId, numeroVersion:Number(v.numeroVersion || 0), nombreArchivo:v.nombreArchivo || '',
        archivoDriveId:v.archivoDriveId || '', archivoDriveUrl:v.archivoDriveUrl || '', cargadoPorNombre:v.cargadoPorNombre || '',
        origenCarga:v.origenCarga || '', comentarioCambio:v.comentarioCambio || '', estadoVersion:v.estadoVersion || 'Borrador',
        aprobadaConferencista:convertirBooleano(v.aprobadaConferencista), aprobadaAudiovisuales:convertirBooleano(v.aprobadaAudiovisuales),
        esVersionActual:convertirBooleano(v.esVersionActual), fechaRegistro:normalizarFechaTemaRespuesta_(v.fechaRegistro), fechaActualizacion:normalizarFechaTemaRespuesta_(v.fechaActualizacion)
      };
    })
    .sort(function(a,b){ return b.numeroVersion-a.numeroVersion; });
}

function listarMusicaTemaParaUsuario_(temaId) {
  return listarRegistrosSheet(HOJA_TEMA_MUSICA, {}, {campoId:'id'})
    .filter(function(v){ return String(v.temaId || '')===String(temaId) && (v.activo==='' || v.activo===undefined || convertirBooleano(v.activo)); })
    .map(function(v){ return {id:v.id,nombreCancion:v.nombreCancion||'',archivoDriveUrl:v.archivoDriveUrl||'',observaciones:v.observaciones||'',fechaRegistro:normalizarFechaTemaRespuesta_(v.fechaRegistro)}; });
}

function crearCarpetasTemaSiNoExisten_(tema, sesion) {
  let raiz = null;
  if (tema.carpetaDriveId) { try { raiz = DriveApp.getFolderById(tema.carpetaDriveId); } catch (e) {} }
  if (!raiz) {
    const padre = obtenerCarpetaRaizTemas_();
    raiz = padre.createFolder(limpiarNombreArchivoTema_(tema.nombre));
  }
  const resultado = { raiz:raiz };
  ['Presentaciones','Música','Recursos','Documentos','Archivos Finales'].forEach(function(nombre){
    const it=raiz.getFoldersByName(nombre); const folder=it.hasNext()?it.next():raiz.createFolder(nombre);
    if(nombre==='Presentaciones') resultado.presentaciones=folder;
    if(nombre==='Música') resultado.musica=folder;
  });
  if (!tema.carpetaDriveId) {
    actualizarRegistroSheet(HOJAS.TEMAS, tema.id, {carpetaDriveId:raiz.getId(),carpetaDriveUrl:raiz.getUrl(),fechaActualizacion:new Date(),actualizadoPor:sesion.usuario||''}, opcionesCrudTemas(sesion.usuario));
  }
  return resultado;
}

function obtenerCarpetaRaizTemas_() {
  const props=PropertiesService.getScriptProperties(); const key='CARPETA_RAIZ_TEMAS_ID'; const id=props.getProperty(key);
  if(id){ try{return DriveApp.getFolderById(id);}catch(e){props.deleteProperty(key);} }
  const carpetas=DriveApp.getFoldersByName('Temas'); const carpeta=carpetas.hasNext()?carpetas.next():DriveApp.createFolder('Temas');
  props.setProperty(key,carpeta.getId()); return carpeta;
}

function obtenerSiguienteNumeroVersionTema_(temaId){ const v=listarVersionesTemaParaUsuario_(temaId); return v.length?Math.max.apply(null,v.map(function(x){return x.numeroVersion||0;}))+1:1; }
function desmarcarVersionActualTema_(temaId,usuario){ listarRegistrosSheet(HOJA_TEMA_VERSIONES,{},opcionesCrudTemaVersion_(usuario)).filter(function(v){return String(v.temaId||'')===String(temaId)&&convertirBooleano(v.esVersionActual);}).forEach(function(v){actualizarRegistroSheet(HOJA_TEMA_VERSIONES,v.id,{esVersionActual:'No',fechaActualizacion:new Date(),actualizadoPor:usuario},opcionesCrudTemaVersion_(usuario));}); }
function opcionesCrudTemaVersion_(usuario){ return {campoId:'id',campoFechaRegistro:'fechaRegistro',campoFechaActualizacion:'fechaActualizacion',campoActualizadoPor:'actualizadoPor',usuario:usuario||''}; }
function validarArchivoTema_(archivo,tipos,codigo){ if(!archivo||!archivo.base64||!archivo.nombre||!archivo.tipo) throw crearErrorAplicacion(codigo,'Seleccione un archivo válido.'); if(tipos.indexOf(String(archivo.tipo).toLowerCase())===-1) throw crearErrorAplicacion(codigo,'El tipo de archivo seleccionado no está permitido.'); }
function decodificarArchivoTema_(archivo){ const bytes=Utilities.base64Decode(String(archivo.base64||'').replace(/^data:[^;]+;base64,/,'')); if(bytes.length>MAX_ARCHIVO_TEMA_BYTES) throw crearErrorAplicacion('ARCHIVO_TEMA_MUY_GRANDE','El archivo no puede superar 15 MB.'); return bytes; }
function obtenerExtensionArchivoTema_(nombre,tipo){ const m=String(nombre||'').match(/\.([^.]+)$/); if(m)return m[1].toLowerCase(); const mapa={'application/pdf':'pdf','application/vnd.ms-powerpoint':'ppt','application/vnd.openxmlformats-officedocument.presentationml.presentation':'pptx','audio/mpeg':'mp3','audio/mp3':'mp3','audio/wav':'wav','audio/x-wav':'wav','audio/mp4':'m4a','audio/x-m4a':'m4a'}; return mapa[String(tipo||'').toLowerCase()]||'bin'; }
function limpiarNombreArchivoTema_(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9._ -]/g,'').replace(/\s+/g,' ').trim().slice(0,140)||'archivo'; }
function calcularEstadoPreparacionConVersiones_(tema){ const req=normalizarSiNoPendienteTema_(tema.requierePresentacion); if(req==='No')return 'Sin presentación'; if(req==='Pendiente'||!tema.servidorId)return 'Pendiente de definición'; const versiones=listarVersionesTemaParaUsuario_(tema.id); if(versiones.length)return versiones[0].estadoVersion||'En revisión'; return 'Pendiente de carga'; }
function normalizarFechaTemaRespuesta_(valor) {
  if (!valor) return '';

  if (Object.prototype.toString.call(valor) === '[object Date]') {
    if (isNaN(valor.getTime())) return '';
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
  }

  const texto = String(valor).trim();
  if (!texto) return '';

  // Fechas importadas con formato dd/MM/yyyy o dd/MM/yyyy HH:mm:ss.
  const coincidencia = texto.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (coincidencia) {
    const fecha = new Date(
      Number(coincidencia[3]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[1]),
      Number(coincidencia[4] || 0),
      Number(coincidencia[5] || 0),
      Number(coincidencia[6] || 0)
    );

    if (!isNaN(fecha.getTime())) {
      return Utilities.formatDate(
        fecha,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd'T'HH:mm:ssXXX"
      );
    }
  }

  const fechaInterpretada = new Date(texto);
  if (!isNaN(fechaInterpretada.getTime())) {
    return Utilities.formatDate(
      fechaInterpretada,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
  }

  return '';
}

function obtenerUrlPlantillaTemas_(){ try{ const c=obtenerConfiguraciones(); return c.urlPlantillaPresentacionTemas||''; }catch(e){return '';} }

/**
 * Guarda la configuración de canción, video o palanca del tema asignado al servidor.
 * Entrega 1: registra la solicitud y deja el recurso pendiente para el equipo responsable.
 */
function guardarRecursosMiTema(token, temaId, datos) {
  const sesion = obtenerSesion(token);
  const tema = validarTemaPerteneceASesion_(sesion, temaId);
  const entrada = datos || {};
  const cambios = {};

  if (entrada.tipo === 'CANCION') {
    const activa = convertirBooleano(entrada.activo);
    const usaEstandar = activa && convertirBooleano(entrada.usaEstandar) && tema.tieneCancionEstandar;
    cambios.requiereMusica = activa ? 'Sí' : 'No';
    cambios.usaCancionEstandar = usaEstandar ? 'Sí' : 'No';
    cambios.cancionTipo = activa ? (usaEstandar ? 'ESTANDAR' : 'PERSONALIZADA') : '';
    cambios.cancionNombre = activa && !usaEstandar ? String(entrada.nombre || '').trim() : '';
    cambios.cancionAutor = activa && !usaEstandar ? String(entrada.autor || '').trim() : '';
    cambios.cancionEnlace = activa && !usaEstandar ? String(entrada.enlace || '').trim() : '';
    cambios.cancionObservaciones = activa ? String(entrada.observaciones || '').trim() : '';
    cambios.cancionEstado = activa ? 'Pendiente de gestión' : '';
    cambios.cancionObservacionesAudiovisuales = '';
    cambios.cancionAprobadaPor = '';
    cambios.cancionFechaAprobacion = '';
    cambios.cancionArchivoDefinitivoId = '';
    cambios.cancionArchivoDefinitivoNombre = '';
    cambios.cancionArchivoDefinitivoUrl = '';
    if (activa && !usaEstandar) {
      if (!cambios.cancionNombre || !cambios.cancionAutor || !cambios.cancionEnlace) {
        throw crearErrorAplicacion('DATOS_CANCION_REQUERIDOS', 'Indique nombre, autor o intérprete y enlace de la canción.');
      }
      validarUrlRecursoMiTema_(cambios.cancionEnlace, 'canción');
    }
  } else if (entrada.tipo === 'VIDEO') {
    const activo = convertirBooleano(entrada.activo);
    const usaEstandar = activo && convertirBooleano(entrada.usaEstandar) && tema.tieneVideoEstandar;
    cambios.usaVideo = activo ? 'Sí' : 'No';
    cambios.usaVideoEstandar = usaEstandar ? 'Sí' : 'No';
    cambios.videoTipo = activo ? (usaEstandar ? 'ESTANDAR' : 'PERSONALIZADO') : '';
    cambios.videoNombre = activo && !usaEstandar ? String(entrada.nombre || '').trim() : '';
    cambios.videoAutorFuente = activo && !usaEstandar ? String(entrada.autorFuente || '').trim() : '';
    cambios.videoEnlace = activo && !usaEstandar ? String(entrada.enlace || '').trim() : '';
    cambios.videoCompleto = activo ? (entrada.videoCompleto === false ? 'No' : 'Sí') : '';
    cambios.videoMinutoInicio = activo && entrada.videoCompleto === false ? String(entrada.minutoInicio || '').trim() : '';
    cambios.videoMinutoFin = activo && entrada.videoCompleto === false ? String(entrada.minutoFin || '').trim() : '';
    cambios.videoMomentoReproduccion = activo ? String(entrada.momentoReproduccion || '').trim() : '';
    cambios.videoObservaciones = activo ? String(entrada.observaciones || '').trim() : '';
    cambios.videoEstado = activo ? 'Pendiente de gestión' : '';
    cambios.videoObservacionesAudiovisuales = '';
    cambios.videoAprobadaPor = '';
    cambios.videoFechaAprobacion = '';
    cambios.videoArchivoDefinitivoId = '';
    cambios.videoArchivoDefinitivoNombre = '';
    cambios.videoArchivoDefinitivoUrl = '';
    if (activo && !usaEstandar) {
      if (!cambios.videoNombre || !cambios.videoAutorFuente || !cambios.videoEnlace) {
        throw crearErrorAplicacion('DATOS_VIDEO_REQUERIDOS', 'Indique nombre, autor o fuente y enlace del video.');
      }
      validarUrlRecursoMiTema_(cambios.videoEnlace, 'video');
    }
    if (activo && entrada.videoCompleto === false && (!cambios.videoMinutoInicio || !cambios.videoMinutoFin)) {
      throw crearErrorAplicacion('FRAGMENTO_VIDEO_REQUERIDO', 'Indique el minuto inicial y final del fragmento de video.');
    }
  } else if (entrada.tipo === 'PALANCA') {
    const activa = convertirBooleano(entrada.activo);
    cambios.requierePalanca = activa ? 'Sí' : 'No';
    cambios.palancaNombre = activa ? String(entrada.nombre || '').trim() : '';
    cambios.palancaDescripcion = activa ? String(entrada.descripcion || '').trim() : '';
    cambios.palancaMomentoEntrega = activa ? String(entrada.momentoEntrega || '').trim() : '';
    cambios.palancaDetalleMomento = activa ? String(entrada.detalleMomento || '').trim() : '';
    cambios.palancaFormaEntrega = activa ? String(entrada.formaEntrega || '').trim() : '';
    cambios.palancaResponsableEntrega = activa ? String(entrada.responsableEntrega || '').trim() : '';
    cambios.palancaDetalleResponsable = activa ? String(entrada.detalleResponsable || '').trim() : '';
    cambios.palancaCantidad = activa ? String(entrada.cantidad || '').trim() : '';
    cambios.palancaDestinatarios = activa ? String(entrada.destinatarios || '').trim() : '';
    cambios.palancaRequierePreparacion = activa && convertirBooleano(entrada.requierePreparacion) ? 'Sí' : 'No';
    cambios.palancaInstrucciones = activa ? String(entrada.instrucciones || '').trim() : '';
    cambios.palancaObservaciones = activa ? String(entrada.observaciones || '').trim() : '';
    cambios.palancaEstado = activa ? 'Pendiente de información' : '';
    if (activa && (!cambios.palancaNombre || !cambios.palancaDescripcion || !cambios.palancaMomentoEntrega || !cambios.palancaFormaEntrega || !cambios.palancaResponsableEntrega || !cambios.palancaDestinatarios || !cambios.palancaInstrucciones)) {
      throw crearErrorAplicacion('DATOS_PALANCA_REQUERIDOS', 'Complete el nombre, descripción, momento, forma, responsable, destinatarios e instrucciones de la palanca.');
    }
  } else {
    throw crearErrorAplicacion('TIPO_RECURSO_INVALIDO', 'El tipo de recurso no es válido.');
  }

  cambios.fechaActualizacion = new Date();
  cambios.actualizadoPor = sesion.usuario || '';
  actualizarRegistroSheet(HOJAS.TEMAS, tema.id, cambios, opcionesCrudTemas(sesion.usuario));
  if ((entrada.tipo === 'CANCION' && cambios.requiereMusica === 'Sí') || (entrada.tipo === 'VIDEO' && cambios.usaVideo === 'Sí')) {
    crearNotificacionTemaAudiovisuales_(tema, {
      tipo: entrada.tipo + '_PENDIENTE_GESTION',
      titulo: entrada.tipo === 'CANCION' ? 'Canción pendiente de gestión' : 'Video pendiente de gestión',
      mensaje: 'El tema “' + tema.nombre + '” registró un recurso audiovisual pendiente.',
      ruta: '/presentaciones', versionId: ''
    }, sesion.usuario);
  }
  auditarTema_(sesion, 'CONFIGURAR_RECURSO_MI_TEMA', tema.id, { tipo: entrada.tipo, cambios: cambios });
  return obtenerMiTemaAsignado(token);
}

function validarUrlRecursoMiTema_(valor, recurso) {
  if (!/^https?:\/\/[^\s]+$/i.test(String(valor || '').trim())) {
    throw crearErrorAplicacion('URL_RECURSO_INVALIDA', 'El enlace del ' + recurso + ' no es válido. Debe iniciar por http:// o https://.');
  }
}

/**
 * ENTREGA 6.2.4
 * Actividad consolidada del tema asignado al servidor autenticado.
 * Incluye versiones y comentarios de presentación, además del historial
 * de canción, video y palanca registrado por los equipos responsables.
 */
function obtenerHistorialGeneralMiTema(token, temaId) {
  const sesion = obtenerSesion(token);
  const tema = validarTemaPerteneceASesion_(sesion, temaId);
  const movimientos = [];

  listarVersionesTemaParaUsuario_(tema.id).forEach(function(version) {
    movimientos.push({
      id: 'VERSION_' + String(version.id || Utilities.getUuid()),
      temaId: tema.id,
      tipoRecurso: 'PRESENTACION',
      titulo: 'Versión ' + String(version.numeroVersion || '') + ' cargada',
      descripcion: String(version.estadoVersion || tema.estadoPreparacion || ''),
      observaciones: String(version.comentarioCambio || ''),
      archivoNombre: String(version.nombreArchivo || ''),
      usuario: String(version.actualizadoPor || version.cargadoPorId || ''),
      nombreUsuario: String(version.cargadoPorNombre || version.origenCarga || ''),
      fecha: version.fechaRegistro || version.fechaActualizacion || '',
      detalle: {
        versionId: version.id || '',
        numeroVersion: version.numeroVersion || '',
        origenCarga: version.origenCarga || '',
        aprobadaAudiovisuales: version.aprobadaAudiovisuales || false,
        aprobadaConferencista: version.aprobadaConferencista || false
      }
    });
  });

  listarComentariosTema_(tema.id).forEach(function(comentario) {
    movimientos.push({
      id: 'COMENTARIO_' + String(comentario.id || Utilities.getUuid()),
      temaId: tema.id,
      tipoRecurso: 'COMENTARIO',
      titulo: String(comentario.tipoComentario || 'Comentario de presentación'),
      descripcion: comentario.numeroVersion ? 'Versión ' + comentario.numeroVersion : 'Presentación',
      observaciones: String(comentario.comentario || ''),
      archivoNombre: '',
      usuario: String(comentario.usuarioId || comentario.actualizadoPor || ''),
      nombreUsuario: String(comentario.usuarioNombre || comentario.rol || ''),
      fecha: comentario.fechaRegistro || comentario.fechaActualizacion || '',
      detalle: { versionId: comentario.versionId || '' }
    });
  });

  const libro = obtenerLibro();
  const hojaHistorial = libro.getSheetByName(
    typeof HOJA_HISTORIAL_RECURSOS_TEMA !== 'undefined'
      ? HOJA_HISTORIAL_RECURSOS_TEMA
      : 'HistorialRecursosTema'
  );

  if (hojaHistorial) {
    leerHojaComoObjetos(hojaHistorial.getName())
      .filter(function(item) {
        return String(item.temaId || '').trim() === String(tema.id || '').trim();
      })
      .forEach(function(item) {
        const tipo = String(item.tipoRecurso || '').toUpperCase();
        const estadoAnterior = String(item.estadoAnterior || '').trim();
        const estadoNuevo = String(item.estadoNuevo || '').trim();
        let detalle = {};
        try { detalle = item.detalle ? JSON.parse(item.detalle) : {}; } catch (ignorado) {}

        movimientos.push({
          id: String(item.id || Utilities.getUuid()),
          temaId: tema.id,
          tipoRecurso: tipo,
          titulo: construirTituloMovimientoRecurso_(tipo, estadoAnterior, estadoNuevo),
          descripcion: estadoAnterior && estadoNuevo
            ? estadoAnterior + ' → ' + estadoNuevo
            : (estadoNuevo || estadoAnterior || 'Recurso actualizado'),
          observaciones: String(item.observaciones || ''),
          archivoNombre: String(item.archivoNombre || ''),
          usuario: String(item.usuario || ''),
          nombreUsuario: String(item.nombreUsuario || ''),
          fecha: item.fecha || '',
          detalle: detalle
        });
      });
  }

  return movimientos
    .filter(function(item) { return item.fecha; })
    .sort(function(a, b) {
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });
}

function construirTituloMovimientoRecurso_(tipo, estadoAnterior, estadoNuevo) {
  const etiquetas = {
    CANCION: 'Música actualizada',
    VIDEO: 'Video actualizado',
    PALANCA: 'Palanca actualizada',
    PRESENTACION: 'Presentación actualizada'
  };
  if (estadoNuevo) return (etiquetas[tipo] || 'Recurso actualizado') + ': ' + estadoNuevo;
  if (estadoAnterior) return (etiquetas[tipo] || 'Recurso actualizado') + ': ' + estadoAnterior;
  return etiquetas[tipo] || 'Recurso actualizado';
}
