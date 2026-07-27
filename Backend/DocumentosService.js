/**
 * ============================================================
 * BIBLIOTECA DOCUMENTAL
 * ============================================================
 * Administra los metadatos en Google Sheets y los archivos en Drive.
 */

const PERMISO_DOCUMENTOS_CONSULTAR = 'DOCUMENTOS_CONSULTAR';
const PERMISO_DOCUMENTOS_CREAR = 'DOCUMENTOS_CREAR';
const PERMISO_DOCUMENTOS_EDITAR = 'DOCUMENTOS_EDITAR';
const PERMISO_DOCUMENTOS_ELIMINAR = 'DOCUMENTOS_ELIMINAR';
const PERMISO_DOCUMENTOS_DESCARGAR = 'DOCUMENTOS_DESCARGAR';
const MAX_ARCHIVO_DOCUMENTO_BYTES = 15 * 1024 * 1024;
const PROPIEDAD_CARPETA_DOCUMENTOS = 'EMAUS_CARPETA_BIBLIOTECA_DOCUMENTAL_ID';

function obtenerDocumentos(token, parametros) {
  validarPermisoSesion(token, PERMISO_DOCUMENTOS_CONSULTAR, 'No tiene permisos para consultar la biblioteca documental.');

  const filtros = parametros || {};
  const texto = normalizarTexto(filtros.texto || filtros.busqueda || '');
  const categoria = normalizarTexto(filtros.categoria || '');
  const temaId = String(filtros.temaId || '').trim();
  const incluirInactivos = convertirBooleano(filtros.incluirInactivos);
  const soloImportantes = convertirBooleano(filtros.soloImportantes);

  const items = leerHojaComoObjetos(HOJAS.DOCUMENTOS)
    .map(convertirDocumentoRespuesta_)
    .filter(function(item) {
      if (!incluirInactivos && !item.activo) return false;
      if (soloImportantes && !item.esImportante) return false;
      if (categoria && normalizarTexto(item.categoria) !== categoria) return false;
      if (temaId && String(item.temaId || '') !== temaId) return false;
      if (texto) {
        const contenido = normalizarTexto([
          item.nombre, item.descripcion, item.categoria, item.nombreArchivo,
          item.etiquetas, item.temaNombre
        ].join(' '));
        if (contenido.indexOf(texto) < 0) return false;
      }
      return true;
    })
    .sort(function(a, b) {
      if (a.esImportante !== b.esImportante) return a.esImportante ? -1 : 1;
      return String(b.actualizadoEn || b.creadoEn || '').localeCompare(String(a.actualizadoEn || a.creadoEn || ''));
    });

  return {
    items: items,
    categorias: obtenerCategoriasDocumentos_(),
    temas: obtenerTemasActivosDocumentos_(),
    indicadores: {
      total: items.length,
      importantes: items.filter(function(item) { return item.esImportante; }).length,
      asociadosATema: items.filter(function(item) { return item.asociadoATema; }).length,
      presentaciones: items.filter(function(item) { return normalizarTexto(item.categoria) === 'presentacion'; }).length,
      canciones: items.filter(function(item) { return normalizarTexto(item.categoria) === 'cancion'; }).length,
      manuales: items.filter(function(item) { return normalizarTexto(item.categoria) === 'manual'; }).length
    }
  };
}

function crearDocumento(token, datos, archivo) {
  const sesion = validarPermisoSesion(token, PERMISO_DOCUMENTOS_CREAR, 'No tiene permisos para cargar documentos.');
  const entrada = validarDatosDocumento_(datos);
  validarArchivoDocumento_(archivo, true);

  const id = Utilities.getUuid();
  const archivoDrive = guardarArchivoDocumento_(archivo, id);
  const ahora = new Date();
  const usuario = sesion.usuario || sesion.nombre || '';
  const contexto = obtenerContextoDocumentos_();
  const fila = new Array(contexto.encabezados.length).fill('');

  asignarDocumentoFila_(fila, contexto.indices, {
    id: id,
    nombre: entrada.nombre,
    descripcion: entrada.descripcion,
    categoria: entrada.categoria,
    etiquetas: entrada.etiquetas,
    asociadoATema: entrada.asociadoATema ? 'Sí' : 'No',
    temaId: entrada.temaId,
    temaNombre: entrada.temaNombre,
    esImportante: entrada.esImportante ? 'Sí' : 'No',
    nombreArchivo: archivo.nombre,
    mimeType: archivo.tipo,
    archivoDriveId: archivoDrive.getId(),
    archivoDriveUrl: archivoDrive.getUrl(),
    activo: 'Sí',
    creadoEn: ahora,
    creadoPor: usuario,
    actualizadoEn: ahora,
    actualizadoPor: usuario
  });

  contexto.hoja.appendRow(fila);
  registrarAuditoriaDocumento_(sesion, 'CREAR_DOCUMENTO', id, 'Se cargó el documento "' + entrada.nombre + '".');
  return { id: id, creado: true };
}

function editarDocumento(token, idIngresado, datos, archivo) {
  const sesion = validarPermisoSesion(token, PERMISO_DOCUMENTOS_EDITAR, 'No tiene permisos para editar documentos.');
  const id = String(idIngresado || '').trim();
  if (!id) throw crearErrorAplicacion('DOCUMENTO_ID_REQUERIDO', 'Debe indicar el documento que desea editar.');

  const entrada = validarDatosDocumento_(datos);
  if (archivo) validarArchivoDocumento_(archivo, true);

  const contexto = obtenerContextoDocumentos_();
  const registro = buscarDocumento_(contexto, id);
  if (!registro) throw crearErrorAplicacion('DOCUMENTO_NO_EXISTE', 'El documento no existe o fue eliminado.');

  const ahora = new Date();
  const usuario = sesion.usuario || sesion.nombre || '';
  const cambios = {
    nombre: entrada.nombre,
    descripcion: entrada.descripcion,
    categoria: entrada.categoria,
    etiquetas: entrada.etiquetas,
    asociadoATema: entrada.asociadoATema ? 'Sí' : 'No',
    temaId: entrada.temaId,
    temaNombre: entrada.temaNombre,
    esImportante: entrada.esImportante ? 'Sí' : 'No',
    actualizadoEn: ahora,
    actualizadoPor: usuario
  };

  if (archivo) {
    const nuevoArchivo = guardarArchivoDocumento_(archivo, id);
    cambios.nombreArchivo = archivo.nombre;
    cambios.mimeType = archivo.tipo;
    cambios.archivoDriveId = nuevoArchivo.getId();
    cambios.archivoDriveUrl = nuevoArchivo.getUrl();

    const anteriorId = String(registro.fila[contexto.indices.archivoDriveId] || '').trim();
    if (anteriorId && anteriorId !== nuevoArchivo.getId()) {
      try { DriveApp.getFileById(anteriorId).setTrashed(true); } catch (ignorado) {}
    }
  }

  actualizarDocumentoFila_(contexto.hoja, registro.numeroFila, contexto.indices, cambios);
  registrarAuditoriaDocumento_(sesion, 'EDITAR_DOCUMENTO', id, 'Se actualizó el documento "' + entrada.nombre + '".');
  return { id: id, actualizado: true };
}

function eliminarDocumento(token, idIngresado) {
  const sesion = validarPermisoSesion(token, PERMISO_DOCUMENTOS_ELIMINAR, 'No tiene permisos para eliminar documentos.');
  const id = String(idIngresado || '').trim();
  if (!id) throw crearErrorAplicacion('DOCUMENTO_ID_REQUERIDO', 'Debe indicar el documento que desea eliminar.');
  const contexto = obtenerContextoDocumentos_();
  const registro = buscarDocumento_(contexto, id);
  if (!registro) throw crearErrorAplicacion('DOCUMENTO_NO_EXISTE', 'El documento no existe o ya fue eliminado.');
  actualizarDocumentoFila_(contexto.hoja, registro.numeroFila, contexto.indices, {
    activo: 'No', actualizadoEn: new Date(), actualizadoPor: sesion.usuario || sesion.nombre || ''
  });
  registrarAuditoriaDocumento_(sesion, 'ELIMINAR_DOCUMENTO', id, 'Se eliminó lógicamente un documento de la biblioteca.');
  return { id: id, eliminado: true };
}

function restaurarDocumento(token, idIngresado) {
  const sesion = validarPermisoSesion(token, PERMISO_DOCUMENTOS_EDITAR, 'No tiene permisos para restaurar documentos.');
  const id = String(idIngresado || '').trim();
  const contexto = obtenerContextoDocumentos_();
  const registro = buscarDocumento_(contexto, id, true);
  if (!registro) throw crearErrorAplicacion('DOCUMENTO_NO_EXISTE', 'El documento no existe.');
  actualizarDocumentoFila_(contexto.hoja, registro.numeroFila, contexto.indices, {
    activo: 'Sí', actualizadoEn: new Date(), actualizadoPor: sesion.usuario || sesion.nombre || ''
  });
  registrarAuditoriaDocumento_(sesion, 'RESTAURAR_DOCUMENTO', id, 'Se restauró un documento de la biblioteca.');
  return { id: id, restaurado: true };
}

function obtenerUrlDescargaDocumento(token, idIngresado) {
  validarPermisoSesion(token, PERMISO_DOCUMENTOS_DESCARGAR, 'No tiene permisos para descargar documentos.');
  const contexto = obtenerContextoDocumentos_();
  const registro = buscarDocumento_(contexto, String(idIngresado || '').trim());
  if (!registro) throw crearErrorAplicacion('DOCUMENTO_NO_EXISTE', 'El documento no existe o fue eliminado.');
  const archivoId = String(registro.fila[contexto.indices.archivoDriveId] || '').trim();
  if (!archivoId) throw crearErrorAplicacion('DOCUMENTO_SIN_ARCHIVO', 'El documento no tiene un archivo asociado.');
  const archivo = DriveApp.getFileById(archivoId);
  return { url: 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(archivoId), nombreArchivo: archivo.getName() };
}

function obtenerContextoDocumentos_() {
  const hoja = obtenerHoja(HOJAS.DOCUMENTOS);
  const datos = hoja.getDataRange().getValues();
  const encabezados = (datos[0] || []).map(convertirEncabezado);
  const campos = ['id','nombre','descripcion','categoria','etiquetas','asociadoATema','temaId','temaNombre','esImportante','nombreArchivo','mimeType','archivoDriveId','archivoDriveUrl','activo','creadoEn','creadoPor','actualizadoEn','actualizadoPor'];
  const indices = {};
  campos.forEach(function(campo) { indices[campo] = encabezados.indexOf(campo); });
  if (indices.id < 0 || indices.nombre < 0 || indices.categoria < 0 || indices.archivoDriveId < 0 || indices.activo < 0 || indices.asociadoATema < 0 || indices.esImportante < 0) {
    throw crearErrorAplicacion('DOCUMENTOS_ESTRUCTURA_INVALIDA', 'La hoja Documentos no tiene la estructura esperada. Ejecute instalarBibliotecaDocumental().');
  }
  return { hoja: hoja, datos: datos, encabezados: encabezados, indices: indices };
}

function buscarDocumento_(contexto, id, incluirInactivo) {
  for (var i = 1; i < contexto.datos.length; i += 1) {
    const fila = contexto.datos[i];
    if (String(fila[contexto.indices.id] || '').trim() !== id) continue;
    if (!incluirInactivo && !convertirBooleano(fila[contexto.indices.activo])) return null;
    return { fila: fila, numeroFila: i + 1 };
  }
  return null;
}

function validarDatosDocumento_(datos) {
  const entrada = datos || {};
  const nombre = String(entrada.nombre || '').replace(/\s+/g, ' ').trim();
  const descripcion = String(entrada.descripcion || '').trim();
  const categoria = normalizarCategoriaDocumento_(entrada.categoria);
  const etiquetas = String(entrada.etiquetas || '').replace(/\s+/g, ' ').trim();
  const asociadoATema = convertirBooleano(entrada.asociadoATema);
  const esImportante = convertirBooleano(entrada.esImportante);
  const temaId = asociadoATema ? String(entrada.temaId || '').trim() : '';
  let temaNombre = '';

  if (!nombre || nombre.length < 3) throw crearErrorAplicacion('DOCUMENTO_NOMBRE_INVALIDO', 'El nombre debe tener al menos 3 caracteres.');
  if (nombre.length > 120) throw crearErrorAplicacion('DOCUMENTO_NOMBRE_LARGO', 'El nombre no puede superar 120 caracteres.');
  if (!categoria) throw crearErrorAplicacion('DOCUMENTO_CATEGORIA_INVALIDA', 'Seleccione una categoría válida.');
  if (descripcion.length > 500) throw crearErrorAplicacion('DOCUMENTO_DESCRIPCION_LARGA', 'La descripción no puede superar 500 caracteres.');
  if (etiquetas.length > 200) throw crearErrorAplicacion('DOCUMENTO_ETIQUETAS_LARGAS', 'Las etiquetas no pueden superar 200 caracteres.');

  if (asociadoATema) {
    if (!temaId) throw crearErrorAplicacion('DOCUMENTO_TEMA_REQUERIDO', 'Seleccione el tema asociado al documento.');
    const tema = obtenerTemasActivosDocumentos_().find(function(item) { return String(item.id) === temaId; });
    if (!tema) throw crearErrorAplicacion('DOCUMENTO_TEMA_INVALIDO', 'El tema seleccionado no existe o no está activo.');
    temaNombre = tema.nombre;
  }

  return {
    nombre: nombre, descripcion: descripcion, categoria: categoria, etiquetas: etiquetas,
    asociadoATema: asociadoATema, temaId: temaId, temaNombre: temaNombre, esImportante: esImportante
  };
}

function obtenerTemasActivosDocumentos_() {
  try {
    return listarRegistrosSheet(HOJAS.TEMAS, {}, opcionesCrudTemas(''))
      .map(function(registro) { return { id: registro.id || '', nombre: registro.nombre || '', activo: convertirBooleano(registro.activo) }; })
      .filter(function(item) { return item.id && item.nombre && item.activo; })
      .sort(function(a, b) { return a.nombre.localeCompare(b.nombre); });
  } catch (error) {
    return [];
  }
}

function validarArchivoDocumento_(archivo, requerido) {
  if (!archivo || !archivo.base64 || !archivo.nombre || !archivo.tipo) {
    if (requerido) throw crearErrorAplicacion('DOCUMENTO_ARCHIVO_REQUERIDO', 'Seleccione un archivo válido.');
    return;
  }
  const nombre = String(archivo.nombre || '').trim();
  if (!nombre || nombre.length > 180) throw crearErrorAplicacion('DOCUMENTO_ARCHIVO_NOMBRE_INVALIDO', 'El nombre del archivo no es válido.');
  decodificarArchivoDocumento_(archivo);
}

function decodificarArchivoDocumento_(archivo) {
  const bytes = Utilities.base64Decode(String(archivo.base64 || '').replace(/^data:[^;]+;base64,/, ''));
  if (!bytes.length) throw crearErrorAplicacion('DOCUMENTO_ARCHIVO_VACIO', 'El archivo seleccionado está vacío.');
  if (bytes.length > MAX_ARCHIVO_DOCUMENTO_BYTES) throw crearErrorAplicacion('DOCUMENTO_ARCHIVO_MUY_GRANDE', 'El archivo no puede superar 15 MB.');
  return bytes;
}

function guardarArchivoDocumento_(archivo, documentoId) {
  const carpeta = obtenerCarpetaDocumentos_();
  const bytes = decodificarArchivoDocumento_(archivo);
  const nombreSeguro = String(archivo.nombre || 'documento').replace(/[\\/:*?"<>|]/g, '_');
  const blob = Utilities.newBlob(bytes, archivo.tipo, documentoId + '_' + nombreSeguro);
  const creado = carpeta.createFile(blob);
  creado.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return creado;
}

function obtenerCarpetaDocumentos_() {
  const propiedades = PropertiesService.getScriptProperties();
  const id = propiedades.getProperty(PROPIEDAD_CARPETA_DOCUMENTOS);
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (ignorado) { propiedades.deleteProperty(PROPIEDAD_CARPETA_DOCUMENTOS); }
  }
  const carpeta = DriveApp.createFolder('Biblioteca documental Emaús');
  propiedades.setProperty(PROPIEDAD_CARPETA_DOCUMENTOS, carpeta.getId());
  return carpeta;
}

function convertirDocumentoRespuesta_(registro) {
  return {
    id: registro.id || '', nombre: registro.nombre || '', descripcion: registro.descripcion || '',
    categoria: registro.categoria || 'Otro', etiquetas: registro.etiquetas || '',
    asociadoATema: convertirBooleano(registro.asociadoATema), temaId: registro.temaId || '',
    temaNombre: registro.temaNombre || '', esImportante: convertirBooleano(registro.esImportante),
    nombreArchivo: registro.nombreArchivo || '', mimeType: registro.mimeType || '',
    archivoDriveUrl: registro.archivoDriveUrl || '', activo: convertirBooleano(registro.activo),
    creadoEn: registro.creadoEn || '', creadoPor: registro.creadoPor || '',
    actualizadoEn: registro.actualizadoEn || '', actualizadoPor: registro.actualizadoPor || ''
  };
}

function normalizarCategoriaDocumento_(valor) {
  const mapa = { 'presentacion':'Presentación', 'cancion':'Canción', 'manual':'Manual', 'formato':'Formato', 'instructivo':'Instructivo', 'otro':'Otro' };
  return mapa[normalizarTexto(valor)] || '';
}
function obtenerCategoriasDocumentos_() { return ['Presentación', 'Canción', 'Manual', 'Formato', 'Instructivo', 'Otro']; }
function asignarDocumentoFila_(fila, indices, valores) { Object.keys(valores).forEach(function(campo) { if (indices[campo] >= 0) fila[indices[campo]] = valores[campo]; }); }
function actualizarDocumentoFila_(hoja, numeroFila, indices, cambios) { Object.keys(cambios).forEach(function(campo) { if (indices[campo] >= 0) hoja.getRange(numeroFila, indices[campo] + 1).setValue(cambios[campo]); }); }
function registrarAuditoriaDocumento_(sesion, accion, id, detalle) {
  if (typeof registrarAuditoria !== 'function') return;
  registrarAuditoria({ usuario: sesion.usuario || '', nombre: sesion.nombre || '', accion: accion, entidad: 'Documentos', idRegistro: id, detalle: detalle });
}
