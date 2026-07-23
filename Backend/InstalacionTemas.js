/** Instala y migra el módulo de Gestión de Temas - Fase 1. */
function instalarModuloTemas() {
  const libro = obtenerLibro();
  const encabezadosTemas = [
    'ID','Nombre','Descripción','Duración Minutos','Día del Tema','Orden del Día','Orden General','Hora Propuesta',
    'Servidor ID','Servidor Nombre','Requiere Presentación','Requiere Testimonio','Requiere Música','Estado Preparación',
    'Aprobación Conferencista','Aprobación Audiovisuales','Versión Aprobada ID','Carpeta Drive ID','Carpeta Drive URL',
    'Observaciones','Activo','Fecha Registro','Fecha Actualización','Actualizado Por'
  ];

  const auxiliares = {
    TemaVersiones: ['ID','Tema ID','Número Versión','Nombre Archivo','Archivo Drive ID','Archivo Drive URL','Cargado Por ID','Cargado Por Nombre','Origen Carga','Comentario Cambio','Estado Versión','Aprobada Conferencista','Aprobada Audiovisuales','Es Versión Actual','Fecha Registro','Fecha Actualización','Actualizado Por'],
    TemaRevisiones: ['ID','Tema ID','Versión ID','Tipo Revisión','Revisor ID','Revisor Nombre','Decisión','Observaciones','Fecha Registro'],
    TemaMusica: ['ID','Tema ID','Nombre Canción','Autor','Plataforma','URL','Archivo Drive ID','Archivo Drive URL','Observaciones','Activo','Fecha Registro','Fecha Actualización','Actualizado Por'],
    TemaArchivos: ['ID','Tema ID','Categoría','Nombre Archivo','Archivo Drive ID','Archivo Drive URL','Cargado Por ID','Cargado Por Nombre','Observaciones','Activo','Fecha Registro'],
    TemaOrdenHistorial: ['ID','Tema ID','Día Anterior','Día Nuevo','Orden Anterior','Orden Nuevo','Usuario ID','Usuario Nombre','Fecha Registro']
  };

  migrarHojaTemas_(libro, encabezadosTemas);
  Object.keys(auxiliares).forEach(function(nombre) { asegurarHojaTemas_(libro, nombre, auxiliares[nombre]); });
  instalarPermisoAdministrarTemas_(libro);
  instalarConfiguracionPlantillaTemas_(libro);

  return { instalado: true, hoja: HOJAS.TEMAS, columnas: encabezadosTemas.length, hojasAuxiliares: Object.keys(auxiliares), permiso: 'ADMINISTRAR_TEMAS' };
}

function migrarHojaTemas_(libro, encabezados) {
  let hoja = libro.getSheetByName(HOJAS.TEMAS);
  if (!hoja) hoja = libro.insertSheet(HOJAS.TEMAS);

  const datosAnteriores = hoja.getLastRow() > 0 && hoja.getLastColumn() > 0 ? hoja.getDataRange().getValues() : [];
  const encabezadosAnteriores = datosAnteriores.length ? datosAnteriores[0].map(String) : [];
  const mapas = encabezadosAnteriores.map(function(valor) { return normalizarEncabezado(valor); });
  const ahora = new Date();
  const conteoDia = {};
  let ordenGeneral = 0;

  const nuevasFilas = datosAnteriores.slice(1).filter(function(fila) { return fila.some(function(v) { return String(v || '').trim(); }); }).map(function(fila) {
    const anterior = {};
    mapas.forEach(function(clave, indice) { anterior[clave] = fila[indice]; });
    ordenGeneral += 1;
    const dia = String(anterior.diaDelTema || 'Sin definir').trim() || 'Sin definir';
    const claveDia = normalizarTexto(dia);
    conteoDia[claveDia] = (conteoDia[claveDia] || 0) + 1;

    const registro = {
      id: anterior.id || ordenGeneral,
      nombre: anterior.nombre || '', descripcion: anterior.descripcion || '', duracionMinutos: anterior.duracionMinutos || '',
      diaDelTema: dia, ordenDelDia: anterior.ordenDelDia || conteoDia[claveDia], ordenGeneral: anterior.ordenGeneral || ordenGeneral,
      horaPropuesta: anterior.horaPropuesta || '', servidorId: anterior.servidorId || '', servidorNombre: anterior.servidorNombre || '',
      requierePresentacion: anterior.requierePresentacion || 'Pendiente', requiereTestimonio: anterior.requiereTestimonio || 'No',
      requiereMusica: anterior.requiereMusica || 'Pendiente', estadoPreparacion: anterior.estadoPreparacion || 'Pendiente de definición',
      aprobacionConferencista: anterior.aprobacionConferencista || 'No', aprobacionAudiovisuales: anterior.aprobacionAudiovisuales || 'No',
      versionAprobadaId: anterior.versionAprobadaId || '', carpetaDriveId: anterior.carpetaDriveId || '', carpetaDriveUrl: anterior.carpetaDriveUrl || '',
      observaciones: anterior.observaciones || '', activo: anterior.activo || 'Sí', fechaRegistro: anterior.fechaRegistro || ahora,
      fechaActualizacion: anterior.fechaActualizacion || ahora, actualizadoPor: anterior.actualizadoPor || 'INSTALADOR'
    };
    return encabezados.map(function(encabezado) { return registro[normalizarEncabezado(encabezado)] !== undefined ? registro[normalizarEncabezado(encabezado)] : ''; });
  });

  hoja.clear();
  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  if (nuevasFilas.length) hoja.getRange(2, 1, nuevasFilas.length, encabezados.length).setValues(nuevasFilas);
  aplicarFormatoHojaTemas_(hoja, encabezados.length);
}

function asegurarHojaTemas_(libro, nombre, encabezados) {
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) hoja = libro.insertSheet(nombre);
  if (hoja.getLastRow() === 0) hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  else {
    const actuales = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getDisplayValues()[0];
    encabezados.forEach(function(encabezado) { if (!actuales.includes(encabezado)) { hoja.getRange(1, hoja.getLastColumn() + 1).setValue(encabezado); actuales.push(encabezado); } });
  }
  aplicarFormatoHojaTemas_(hoja, hoja.getLastColumn());
}

function aplicarFormatoHojaTemas_(hoja, columnas) {
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, columnas).setFontWeight('bold').setBackground('#173b34').setFontColor('#ffffff');
  hoja.autoResizeColumns(1, columnas);
}

function instalarPermisoAdministrarTemas_(libro) {
  const hoja = libro.getSheetByName(HOJAS.PERMISOS_ROL);
  if (!hoja) throw new Error('No existe la hoja PermisosRol. Ejecute primero el instalador de seguridad.');
  const filas = leerHojaComoObjetos(HOJAS.PERMISOS_ROL);
  const existe = filas.some(function(item) { return normalizarTexto(item.rol) === 'administrador' && normalizarPermiso(item.permiso) === 'ADMINISTRAR_TEMAS'; });
  if (!existe) hoja.appendRow(['Administrador', 'ADMINISTRAR_TEMAS', 'Sí']);
  CacheService.getScriptCache().remove(CLAVE_CACHE_PERMISOS_ROL);
}

function instalarConfiguracionPlantillaTemas_(libro) {
  const hoja = libro.getSheetByName(HOJAS.CONFIGURACIONES);
  if (!hoja) return;
  const filas = leerHojaComoObjetos(HOJAS.CONFIGURACIONES);
  const existe = filas.some(function(item) { return normalizarTexto(item.clave) === normalizarTexto('urlPlantillaPresentacionTemas'); });
  if (!existe) hoja.appendRow(['urlPlantillaPresentacionTemas', '', 'Texto', 'URL de la plantilla PowerPoint para los conferencistas', 'SI', 'Plantilla de presentación de temas']);
  CacheService.getScriptCache().remove(CLAVE_CACHE_CONFIGURACIONES);
}

/**
 * Convierte un encabezado visible de Google Sheets en la clave usada por los
 * servicios del backend. Se mantiene local al instalador para no depender de
 * funciones auxiliares de otros módulos.
 */
function normalizarEncabezado(valor) {
  const texto = String(valor == null ? '' : valor)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+(.)/g, function(_, caracter) {
      return caracter ? caracter.toUpperCase() : '';
    });

  return texto ? texto.charAt(0).toLowerCase() + texto.slice(1) : '';
}
