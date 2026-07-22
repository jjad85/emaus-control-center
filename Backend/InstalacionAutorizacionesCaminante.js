/** Ejecutar una sola vez: instalarAutorizacionesCaminante(); */
function instalarAutorizacionesCaminante() {
  const libro = obtenerLibro();

  if (!libro) {
    throw new Error('No fue posible abrir el Google Sheets configurado en SPREADSHEET_ID.');
  }

  const hojaCaminantes = libro.getSheetByName(HOJAS.CAMINANTES || 'Caminantes');
  const hojaAspirantes = libro.getSheetByName(HOJAS.ASPIRANTES || 'Aspirantes');

  if (!hojaCaminantes) {
    throw new Error('No existe la hoja Caminantes en el Google Sheets configurado.');
  }

  if (!hojaAspirantes) {
    throw new Error('No existe la hoja Aspirantes en el Google Sheets configurado.');
  }

  instalarColumnasAutorizaciones_(hojaCaminantes);
  instalarColumnasAutorizaciones_(hojaAspirantes);
  instalarHojaAuditoriaAutorizaciones_(libro);
  instalarParametrosAutorizaciones_(libro);
  instalarPermisoAutorizaciones_(libro);
  limpiarCacheConfiguraciones();
  limpiarCachePermisos();
  SpreadsheetApp.flush();
  return { ok: true, mensaje: 'Autorizaciones de caminantes instaladas correctamente.' };
}

function instalarColumnasAutorizaciones_(hoja) {
  if (!hoja) throw new Error('No se recibió una hoja válida para instalar las columnas de autorizaciones.');
  const columnas = [
    'Autoriza Tratamiento Datos', 'Autoriza Fotografías',
    'Versión Autorización Datos', 'Fecha Aceptación Datos', 'Texto Autorización Datos',
    'Versión Autorización Fotografías', 'Fecha Aceptación Fotografías', 'Texto Autorización Fotografías'
  ];
  const actuales = hoja.getRange(1, 1, 1, Math.max(1, hoja.getLastColumn())).getDisplayValues()[0].map(normalizarTexto);
  columnas.forEach(function(columna) {
    if (actuales.indexOf(normalizarTexto(columna)) < 0) hoja.getRange(1, hoja.getLastColumn() + 1).setValue(columna);
  });
  hoja.getRange(1, 1, 1, hoja.getLastColumn()).setFontWeight('bold');
}

function instalarHojaAuditoriaAutorizaciones_(libro) {
  let hoja = libro.getSheetByName('AutorizacionesCaminantes');
  if (!hoja) hoja = libro.insertSheet('AutorizacionesCaminantes');
  const encabezados = ['id','caminanteId','aspiranteId','tokenHash','estado','resultado','fechaGeneracion','fechaExpiracion','generadoPor','fechaEnvio','fechaRespuesta','activo'];
  hoja.getRange(1,1,1,encabezados.length).setValues([encabezados]).setFontWeight('bold').setBackground('#173b34').setFontColor('#ffffff');
  hoja.setFrozenRows(1);
}

function instalarParametrosAutorizaciones_(libro) {
  const hoja = libro.getSheetByName('Configuraciones');
  const filas = [
    ['minutosVigenciaEnlaceAutorizaciones','120','Numero','Minutos de vigencia del enlace público de autorizaciones','Sí'],
    ['urlBaseAplicacion','https://REEMPLAZAR-POR-LA-URL-DE-LA-APLICACION','Texto','URL pública del frontend sin barra al final','Sí'],
    ['whatsappMensajeAutorizaciones','Hola {{nombre}}.\n\nPara finalizar tu proceso de inscripción necesitamos que leas y respondas las autorizaciones de tratamiento de datos personales y uso de fotografías.\n\n{{link}}\n\nEl enlace estará disponible durante {{minutos}} minutos.','Texto','Mensaje de WhatsApp para autorizaciones. Variables: {{nombre}}, {{link}}, {{minutos}}','Sí']
  ];
  const datos = hoja.getDataRange().getDisplayValues();
  const claves = datos.slice(1).map(function(f){ return String(f[0]).trim(); });
  filas.forEach(function(fila){ const p=claves.indexOf(fila[0]); if(p>=0) hoja.getRange(p+2,1,1,fila.length).setValues([fila]); else hoja.appendRow(fila); });
}

function instalarPermisoAutorizaciones_(libro) {
  const hoja = libro.getSheetByName('PermisosRol');
  const datos = hoja.getDataRange().getDisplayValues();
  const existe = datos.some(function(f){ return String(f[0]).trim()==='Administrador' && String(f[1]).trim()==='ENVIAR_AUTORIZACIONES_CAMINANTE'; });
  if (!existe) hoja.appendRow(['Administrador','ENVIAR_AUTORIZACIONES_CAMINANTE','Sí']);
}
