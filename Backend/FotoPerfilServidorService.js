/** Gestión de fotografía de perfil del servidor autenticado. */
const FOTO_PERFIL_SERVIDOR_MAX_BYTES = 2 * 1024 * 1024;
const FOTO_PERFIL_SERVIDOR_TIPOS = ['image/jpeg','image/jpg','image/png','image/webp'];

function obtenerMiFotoPerfilServidor(token) {
  const servidor = obtenerMiCuentaServidor(token);
  return {
    id: servidor.id,
    nombre: servidor.nombre || '',
    fotoPerfilId: servidor.fotoPerfilId || '',
    fotoPerfilUrl: servidor.fotoPerfilUrl || '',
    fechaActualizacionFoto: servidor.fechaActualizacionFoto || ''
  };
}

function actualizarMiFotoPerfilServidor(token, archivo) {
  const sesion = obtenerSesion(token);
  const servidor = obtenerMiCuentaServidor(token);
  validarArchivoFotoPerfilServidor_(archivo);
  const bytes = Utilities.base64Decode(String(archivo.base64 || '').replace(/^data:[^;]+;base64,/, ''));
  if (bytes.length > FOTO_PERFIL_SERVIDOR_MAX_BYTES) {
    throw crearErrorAplicacion('FOTO_PERFIL_MUY_GRANDE','La fotografía no puede superar 2 MB.');
  }
  const carpeta = obtenerCarpetaFotosPerfilServidores_();
  const extension = obtenerExtensionFotoPerfilServidor_(archivo.tipo, archivo.nombre);
  const nombreArchivo = 'SERVIDOR_' + limpiarNombreArchivoFoto_(servidor.id || servidor.nombre || 'SIN_ID') + '_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss') + '.' + extension;
  const blob = Utilities.newBlob(bytes, String(archivo.tipo).toLowerCase(), nombreArchivo);
  const nuevoArchivo = carpeta.createFile(blob);
  nuevoArchivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const fotoAnteriorId = String(servidor.fotoPerfilId || '').trim();
  const urlVisualizacion = 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(nuevoArchivo.getId()) + '&sz=w1000';
  actualizarRegistroSheet(HOJAS.SERVIDORES, servidor.id, {
    fotoPerfilId: nuevoArchivo.getId(),
    fotoPerfilUrl: urlVisualizacion,
    fechaActualizacionFoto: new Date(),
    fechaActualizacion: new Date(),
    actualizadoPor: sesion.usuario
  }, { usuario: sesion.usuario });
  eliminarFotoPerfilAnteriorServidor_(fotoAnteriorId, nuevoArchivo.getId());
  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria({usuario:sesion.usuario,nombre:sesion.nombre || servidor.nombre || '',accion:'ACTUALIZAR_FOTO_PERFIL',entidad:'Servidores',idRegistro:servidor.id,detalle:'El servidor actualizó su fotografía de perfil.'});
  }
  return {id:servidor.id,fotoPerfilId:nuevoArchivo.getId(),fotoPerfilUrl:urlVisualizacion,fechaActualizacionFoto:new Date()};
}

function eliminarMiFotoPerfilServidor(token) {
  const sesion = obtenerSesion(token);
  const servidor = obtenerMiCuentaServidor(token);
  const fotoAnteriorId = String(servidor.fotoPerfilId || '').trim();
  actualizarRegistroSheet(HOJAS.SERVIDORES, servidor.id, {
    fotoPerfilId:'',fotoPerfilUrl:'',fechaActualizacionFoto:new Date(),fechaActualizacion:new Date(),actualizadoPor:sesion.usuario
  }, {usuario:sesion.usuario});
  eliminarFotoPerfilAnteriorServidor_(fotoAnteriorId, '');
  if (typeof registrarAuditoria === 'function') {
    registrarAuditoria({usuario:sesion.usuario,nombre:sesion.nombre || servidor.nombre || '',accion:'ELIMINAR_FOTO_PERFIL',entidad:'Servidores',idRegistro:servidor.id,detalle:'El servidor eliminó su fotografía de perfil.'});
  }
  return {id:servidor.id,fotoPerfilId:'',fotoPerfilUrl:'',fechaActualizacionFoto:new Date()};
}

function validarArchivoFotoPerfilServidor_(archivo) {
  if (!archivo || !archivo.base64 || !archivo.nombre || !archivo.tipo) {
    throw crearErrorAplicacion('FOTO_PERFIL_REQUERIDA','Seleccione una fotografía.');
  }
  const tipo = String(archivo.tipo).toLowerCase();
  if (FOTO_PERFIL_SERVIDOR_TIPOS.indexOf(tipo) === -1) {
    throw crearErrorAplicacion('FOTO_PERFIL_TIPO_INVALIDO','Solo se permiten fotografías JPG, JPEG, PNG o WEBP.');
  }
}

function obtenerCarpetaFotosPerfilServidores_() {
  const propiedades = PropertiesService.getScriptProperties();
  const propiedad = 'CARPETA_FOTOS_PERFIL_SERVIDORES_ID';
  const carpetaId = propiedades.getProperty(propiedad);
  if (carpetaId) {
    try { return DriveApp.getFolderById(carpetaId); }
    catch (error) { propiedades.deleteProperty(propiedad); }
  }
  const carpeta = DriveApp.createFolder('Fotos perfil servidores Emaús');
  propiedades.setProperty(propiedad, carpeta.getId());
  return carpeta;
}

function eliminarFotoPerfilAnteriorServidor_(fotoAnteriorId, fotoNuevaId) {
  if (!fotoAnteriorId || fotoAnteriorId === fotoNuevaId) return;
  try { DriveApp.getFileById(fotoAnteriorId).setTrashed(true); } catch (error) {}
}

function obtenerExtensionFotoPerfilServidor_(tipo, nombre) {
  const mapa = {'image/jpeg':'jpg','image/jpg':'jpg','image/png':'png','image/webp':'webp'};
  const tipoNormalizado = String(tipo || '').toLowerCase();
  if (mapa[tipoNormalizado]) return mapa[tipoNormalizado];
  const coincidencia = String(nombre || '').match(/\.([^.]+)$/);
  return coincidencia ? coincidencia[1].toLowerCase() : 'jpg';
}

function limpiarNombreArchivoFoto_(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,80) || 'SERVIDOR';
}
