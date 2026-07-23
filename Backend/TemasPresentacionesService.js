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

  ordenarTemasEnMemoria_(temas);
  const plantilla = obtenerUrlPlantillaTemas_();

  return {
    items: temas.map(function(tema) {
      tema.versiones = listarVersionesTemaParaUsuario_(tema.id);
      tema.musica = listarMusicaTemaParaUsuario_(tema.id);
      tema.versionActual = tema.versiones.find(function(v) { return v.esVersionActual; }) || null;
      return tema;
    }),
    plantillaUrl: plantilla,
    servidorId: servidorId,
    usuario: sesion.usuario || ''
  };
}

function subirVersionTema(token, temaId, archivo, comentario) {
  const sesion = obtenerSesion(token);
  return ejecutarCrudConBloqueo(function() {
    const tema = validarTemaPerteneceASesion_(sesion, temaId);
    if (normalizarSiNoPendienteTema_(tema.requierePresentacion) === 'No') {
      throw crearErrorAplicacion('TEMA_SIN_PRESENTACION', 'Este tema está marcado como que no requiere presentación.');
    }
    validarArchivoTema_(archivo, TIPOS_PRESENTACION_TEMA, 'PRESENTACION_INVALIDA');
    const bytes = decodificarArchivoTema_(archivo);
    const carpetas = crearCarpetasTemaSiNoExisten_(tema, sesion);
    const numero = obtenerSiguienteNumeroVersionTema_(tema.id);
    const extension = obtenerExtensionArchivoTema_(archivo.nombre, archivo.tipo);
    const nombre = limpiarNombreArchivoTema_(tema.id + '_V' + numero + '_' + tema.nombre) + '.' + extension;
    const file = carpetas.presentaciones.createFile(Utilities.newBlob(bytes, archivo.tipo, nombre));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    desmarcarVersionActualTema_(tema.id, sesion.usuario);

    const creado = crearRegistroSheet(HOJA_TEMA_VERSIONES, {
      temaId: tema.id,
      numeroVersion: numero,
      nombreArchivo: nombre,
      archivoDriveId: file.getId(),
      archivoDriveUrl: file.getUrl(),
      cargadoPorId: sesion.servidorId || '',
      cargadoPorNombre: sesion.nombre || tema.servidorNombre || '',
      origenCarga: 'Conferencista',
      comentarioCambio: String(comentario || '').trim(),
      estadoVersion: 'En revisión',
      aprobadaConferencista: 'Sí',
      aprobadaAudiovisuales: 'No',
      esVersionActual: 'Sí',
      fechaRegistro: new Date(),
      fechaActualizacion: new Date(),
      actualizadoPor: sesion.usuario || ''
    }, opcionesCrudTemaVersion_(sesion.usuario));

    actualizarRegistroSheet(HOJAS.TEMAS, tema.id, {
      requierePresentacion: 'Sí',
      estadoPreparacion: 'En revisión',
      aprobacionConferencista: 'Sí',
      aprobacionAudiovisuales: 'No',
      versionAprobadaId: '',
      carpetaDriveId: carpetas.raiz.getId(),
      carpetaDriveUrl: carpetas.raiz.getUrl(),
      fechaActualizacion: new Date(),
      actualizadoPor: sesion.usuario || ''
    }, opcionesCrudTemas(sesion.usuario));

    auditarTema_(sesion, 'SUBIR_VERSION_PRESENTACION', tema.id, { versionId: creado.id, numeroVersion: numero });
    return listarVersionesTemaParaUsuario_(tema.id);
  });
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
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
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
    raiz = padre.createFolder(limpiarNombreArchivoTema_(String(tema.ordenGeneral || '') + ' - ' + tema.nombre));
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
